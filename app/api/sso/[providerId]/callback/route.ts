/**
 * generic SSO callback handler
 * handle any CAS provider callback, validate ticket, create or find user, establish session
 */
import { SSOUserService } from '@lib/services/admin/user/sso-user-service';
import { CASConfigService } from '@lib/services/sso/generic-cas-service';
import { validateRedirectUrl } from '@lib/utils/redirect-validation';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const requestUrl = new URL(request.url);
  const ticket = requestUrl.searchParams.get('ticket');
  const returnUrl = requestUrl.searchParams.get('returnUrl') || '/chat';
  const { providerId } = await params;

  // validate redirect URL to prevent open redirect attacks
  const validatedReturnUrl = validateRedirectUrl(
    returnUrl,
    request.url,
    '/chat'
  );

  console.log(
    `SSO callback received for provider ${providerId} - ticket: ${ticket ? 'present' : 'missing'}, returnUrl: ${returnUrl} (validated: ${validatedReturnUrl})`
  );

  // get config app URL, for building redirect URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not configured');
  }

  if (!ticket) {
    console.error(
      `SSO callback: missing ticket parameter for provider ${providerId}`
    );
    return NextResponse.redirect(
      new URL(
        '/login?error=missing_ticket&message=Authentication parameter missing, please try again',
        appUrl
      )
    );
  }

  try {
    // create generic CAS service instance
    const casService = await CASConfigService.createCASService(providerId);
    const casConfig = casService.getConfig();

    // validate ticket - ensure service URL matches exactly with login time
    // fix: use the same logic as login time to build service URL
    let serviceUrl = `${appUrl}/api/sso/${providerId}/callback`;
    if (returnUrl) {
      // if returnUrl parameter exists, add it to service URL
      // this maintains consistency with login time service URL
      serviceUrl = `${serviceUrl}?returnUrl=${encodeURIComponent(returnUrl)}`;
    }
    console.log(`Using service URL for ticket validation: ${serviceUrl}`);

    const validationResult = await casService.validateTicket(
      ticket,
      serviceUrl
    );

    console.log(
      `CAS ticket validation result for ${casConfig.name}:`,
      validationResult.success ? 'SUCCESS' : 'FAILED'
    );

    if (!validationResult.success) {
      console.error(
        `CAS validation failed for ${casConfig.name}:`,
        validationResult.attributes
      );
      return NextResponse.redirect(
        new URL(
          '/login?error=cas_validation_failed&message=Failed to validate CAS ticket, please try again',
          appUrl
        )
      );
    }

    // extract user info
    const employeeNumberStr = validationResult.employeeNumber;
    const username = validationResult.username;
    const fullName = validationResult.attributes?.name || username;

    if (!employeeNumberStr) {
      console.error(
        `No employee number found in CAS response for ${casConfig.name}`
      );
      return NextResponse.redirect(
        new URL(
          '/login?error=missing_employee_number&message=Failed to validate employee number, please try again',
          appUrl
        )
      );
    }

    console.log(
      `Processing SSO user for ${casConfig.name}: ${username} (${employeeNumberStr}), name: ${fullName}`
    );

    // get full CAS config (pre-fetch)
    const casFullConfig = await CASConfigService.getCASConfig(providerId);

    // find or create user
    let user = await SSOUserService.findUserByEmployeeNumber(employeeNumberStr);

    if (!user) {
      console.log(
        `Creating new user for employee: ${employeeNumberStr} via ${casConfig.name}`
      );

      console.log(
        `Using SSO provider for user creation: ${casFullConfig.name}`
      );

      user = await SSOUserService.createSSOUser({
        employeeNumber: employeeNumberStr,
        username: username,
        fullName: fullName,
        ssoProviderId: casFullConfig.id,
        ssoProviderName: casFullConfig.name,
        emailDomain: casFullConfig.emailDomain,
      });

      console.log(
        `Created new user: ${user.id} for employee ${employeeNumberStr}`
      );
    } else {
      console.log(
        `Found existing user: ${user.id} for employee ${employeeNumberStr}`
      );

      // update last login time
      await SSOUserService.updateLastLogin(user.id);
    }

    // use email domain from config
    const userEmail = `${user.employee_number || employeeNumberStr}@${casFullConfig.emailDomain}`;

    console.log(
      `Preparing to create Supabase session for user: ${user.id}, email: ${userEmail}`
    );

    // build SSO user data for session creation
    const ssoUserData = {
      userId: user.id,
      employeeNumber: employeeNumberStr,
      username: username,
      fullName: fullName,
      provider: casFullConfig.name,
      loginTime: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      authSource: `${casFullConfig.name.toLowerCase().replace(/\s+/g, '_')}_sso`,
    };

    // redirect to SSO processing page, frontend will POST to signin API
    const processingUrl = new URL('/sso/processing', appUrl);
    processingUrl.searchParams.set('sso_login', 'success');
    processingUrl.searchParams.set('user_id', user.id);
    processingUrl.searchParams.set('user_email', userEmail);
    processingUrl.searchParams.set('redirect_to', validatedReturnUrl);
    processingUrl.searchParams.set('welcome', fullName);

    console.log(
      `Redirecting to SSO processing page for session creation: ${processingUrl.toString()}`
    );

    // create response object and set SSO user data cookie for frontend use
    const response = NextResponse.redirect(processingUrl.toString());
    const cookieValue = JSON.stringify(ssoUserData);

    // debug: output the cookie value
    console.log(
      'Setting cookie value (first 100 chars):',
      cookieValue.substring(0, 100)
    );
    console.log('Cookie value length:', cookieValue.length);

    // split sensitive and non-sensitive data
    // store sensitive data in httpOnly cookie, accessible data in regular cookie
    const sensitiveData = {
      userId: ssoUserData.userId,
      employeeNumber: ssoUserData.employeeNumber,
      authSource: ssoUserData.authSource,
      loginTime: ssoUserData.loginTime,
      expiresAt: ssoUserData.expiresAt,
    };

    const publicData = {
      username: ssoUserData.username,
      fullName: ssoUserData.fullName,
      provider: ssoUserData.provider,
    };

    // store sensitive data in httpOnly cookie (secure from XSS)
    response.cookies.set({
      name: 'sso_user_data_secure',
      value: JSON.stringify(sensitiveData),
      maxAge: 10 * 60, // 10 minutes
      httpOnly: true, // prevent XSS attacks by blocking JavaScript access
      secure: appUrl.startsWith('https'),
      sameSite: 'lax',
      path: '/',
    });

    // store non-sensitive data in accessible cookie (for frontend use)
    response.cookies.set({
      name: 'sso_user_data',
      value: JSON.stringify(publicData),
      maxAge: 10 * 60, // 10 minutes
      httpOnly: false, // frontend needs access to display name and basic info
      secure: appUrl.startsWith('https'),
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error(
      `SSO callback processing failed for provider ${providerId}:`,
      error
    );

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(
        `/login?error=sso_callback_error&message=${encodeURIComponent(`SSO login processing failed: ${errorMessage}`)}`,
        appUrl
      )
    );
  }
}
