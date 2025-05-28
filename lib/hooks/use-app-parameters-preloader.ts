import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAppListStore } from '@lib/stores/app-list-store';
import { useSupabaseAuth } from '@lib/supabase/hooks';
import { useCurrentApp } from '@lib/hooks/use-current-app';

/**
 * 应用参数预加载Hook
 * 
 * 🎯 优化后的用途：
 * 1. 只在登录状态下预加载
 * 2. 只在需要app的页面预加载
 * 3. 分层预加载：立即加载关键应用，延迟加载其他应用
 * 4. 提供手动触发预加载的方法
 * 5. 监控预加载状态
 * 
 * 使用场景：
 * - 在根组件或布局组件中使用
 * - 自动检测页面类型和登录状态
 */
export function useAppParametersPreloader() {
  const pathname = usePathname();
  const { session } = useSupabaseAuth();
  const { currentAppId } = useCurrentApp();
  
  // --- BEGIN COMMENT ---
  // 🎯 添加请求去重机制，防止重复请求
  // --- END COMMENT ---
  const isPreloadingRef = useRef(false);
  const lastPreloadTimeRef = useRef(0);
  const hasTriggeredRef = useRef(false); // 添加是否已触发过的标记
  
  const { 
    apps,
    parametersCache,
    isLoadingParameters,
    parametersError,
    fetchApps,
    fetchAllAppParameters,
    fetchAppParameters,
    lastParametersFetchTime
  } = useAppListStore();

  // --- BEGIN COMMENT ---
  // 🎯 检查是否为需要app的页面
  // --- END COMMENT ---
  const isAppRelatedPage = useCallback(() => {
    if (!pathname) return false;
    
    const appPages = ['/chat', '/app'];
    return appPages.some(page => pathname.startsWith(page));
  }, [pathname]);

  // --- BEGIN COMMENT ---
  // 🎯 检查是否应该激活预加载
  // 只有在登录状态且在相关页面时才激活
  // --- END COMMENT ---
  const shouldActivatePreloader = useCallback(() => {
    // 检查是否已登录
    if (!session?.user) {
      console.log('[Preloader] 用户未登录，跳过预加载');
      return false;
    }
    
    // 检查是否在需要app的页面
    if (!isAppRelatedPage()) {
      console.log('[Preloader] 当前页面不需要app，跳过预加载:', pathname);
      return false;
    }
    
    return true;
  }, [session?.user, isAppRelatedPage, pathname]);

  // --- BEGIN COMMENT ---
  // 🎯 分类应用：关键应用 vs 其他应用
  // 优化：为config为空的应用提供更智能的默认分类
  // 移除currentAppId依赖，避免频繁重新计算
  // --- END COMMENT ---
  const categorizeApps = useCallback(() => {
    const criticalApps: string[] = [];
    const otherApps: string[] = [];
    
    apps.forEach(app => {
      const metadata = app.config?.app_metadata;
      
      // 当前应用始终是关键应用
      if (app.instance_id === currentAppId) {
        criticalApps.push(app.instance_id);
        return;
      }
      
      // 如果有元数据配置，按配置分类
      if (metadata) {
        // 常用模型是关键应用
        if (metadata.is_common_model) {
          criticalApps.push(app.instance_id);
          return;
        }
        
        // 模型类型的应用优先级较高
        if (metadata.app_type === 'model') {
          criticalApps.push(app.instance_id);
          return;
        }
        
        // 应用市场应用归为其他应用
        if (metadata.app_type === 'marketplace' || metadata.is_marketplace_app) {
          otherApps.push(app.instance_id);
          return;
        }
      }
      
      // 🎯 新增：为没有配置的应用提供智能默认分类
      // 如果没有元数据配置，根据应用名称和ID进行启发式分类
      if (!metadata || Object.keys(metadata).length === 0) {
        const appName = (app.display_name || app.name || app.instance_id).toLowerCase();
        
        // 根据名称关键词判断是否为模型类型
        const modelKeywords = ['gpt', 'claude', 'gemini', 'llama', 'qwen', '通义', '模型', 'model', 'chat', '对话'];
        const isLikelyModel = modelKeywords.some(keyword => appName.includes(keyword));
        
        // 根据名称关键词判断是否为应用市场应用
        const marketplaceKeywords = ['翻译', 'translate', '代码', 'code', '助手', 'assistant', '工具', 'tool', '生成', 'generate'];
        const isLikelyMarketplace = marketplaceKeywords.some(keyword => appName.includes(keyword));
        
        if (isLikelyModel && !isLikelyMarketplace) {
          // 可能是模型，归为关键应用
          criticalApps.push(app.instance_id);
          console.log(`[Preloader] 应用 ${app.instance_id} 无配置，根据名称"${appName}"推断为模型类型，归为关键应用`);
          return;
        } else if (isLikelyMarketplace) {
          // 可能是应用市场应用，归为其他应用
          otherApps.push(app.instance_id);
          console.log(`[Preloader] 应用 ${app.instance_id} 无配置，根据名称"${appName}"推断为应用市场类型，归为其他应用`);
          return;
        } else {
          // 无法判断，默认归为关键应用（保守策略）
          criticalApps.push(app.instance_id);
          console.log(`[Preloader] 应用 ${app.instance_id} 无配置且无法从名称"${appName}"推断类型，默认归为关键应用`);
          return;
        }
      }
      
      // 兜底：其他情况归为关键应用（保守策略）
      criticalApps.push(app.instance_id);
    });
    
    console.log(`[Preloader] 应用分类完成 - 关键应用: ${criticalApps.length}个, 其他应用: ${otherApps.length}个`);
    console.log(`[Preloader] 关键应用列表:`, criticalApps);
    console.log(`[Preloader] 其他应用列表:`, otherApps);
    
    return { criticalApps, otherApps };
  }, [apps]); // 只依赖apps，移除currentAppId

  // --- BEGIN COMMENT ---
  // 🎯 检查是否需要预加载数据
  // 只有在激活状态下才检查数据
  // --- END COMMENT ---
  const shouldPreload = useCallback(() => {
    // 首先检查是否应该激活预加载
    if (!shouldActivatePreloader()) return false;
    
    // 检查是否正在预加载中，避免重复触发
    if (isPreloadingRef.current) {
      console.log('[Preloader] 正在预加载中，跳过重复触发');
      return false;
    }
    
    // 防抖：距离上次预加载不足1秒，跳过
    const now = Date.now();
    if (now - lastPreloadTimeRef.current < 1000) {
      console.log('[Preloader] 距离上次预加载时间过短，跳过');
      return false;
    }
    
    // 如果没有应用列表，需要先获取应用列表
    if (apps.length === 0) return true;
    
    // 检查关键应用是否已缓存
    const { criticalApps } = categorizeApps();
    const criticalAppsCached = criticalApps.every(appId => parametersCache[appId]);
    
    if (!criticalAppsCached) return true;
    
    // 如果缓存过期（超过5分钟），需要重新加载
    const CACHE_DURATION = 5 * 60 * 1000;
    const isExpired = Date.now() - lastParametersFetchTime > CACHE_DURATION;
    if (isExpired) return true;
    
    return false;
  }, [shouldActivatePreloader, apps.length, parametersCache, lastParametersFetchTime, categorizeApps]);

  // --- BEGIN COMMENT ---
  // 🎯 分层预加载策略
  // 1. 立即加载关键应用（当前app + 常用模型 + 模型类型应用）
  // 2. 延迟加载其他应用（应用市场应用等）
  // 添加请求去重和防抖机制
  // --- END COMMENT ---
  const triggerPreload = useCallback(async () => {
    // 再次检查是否应该预加载（防止状态变化）
    if (!shouldActivatePreloader()) {
      console.log('[Preloader] 预加载条件不满足，取消预加载');
      return;
    }
    
    // 检查是否正在预加载中
    if (isPreloadingRef.current) {
      console.log('[Preloader] 已在预加载中，跳过重复请求');
      return;
    }
    
    // 设置预加载状态
    isPreloadingRef.current = true;
    lastPreloadTimeRef.current = Date.now();
    
    try {
      console.log('[Preloader] 开始分层预加载');
      
      // 获取最新的store状态和方法
      const currentState = useAppListStore.getState();
      
      // 确保有应用列表
      if (currentState.apps.length === 0) {
        console.log('[Preloader] 先获取应用列表');
        await currentState.fetchApps();
      }
      
      // 重新获取最新的应用列表
      const updatedState = useAppListStore.getState();
      const currentApps = updatedState.apps;
      
      if (currentApps.length === 0) {
        console.log('[Preloader] 获取应用列表后仍为空，跳过预加载');
        return;
      }
      
      // --- BEGIN COMMENT ---
      // 🎯 添加全局请求锁，确保每个应用只请求一次
      // 检查哪些应用已经有缓存，只请求没有缓存的应用
      // --- END COMMENT ---
      const currentCache = updatedState.parametersCache;
      const CACHE_DURATION = 5 * 60 * 1000;
      const now = Date.now();
      
      // 过滤出需要请求的应用（没有缓存或缓存过期的）
      const appsNeedingFetch = currentApps.filter(app => {
        const cached = currentCache[app.instance_id];
        if (!cached) return true; // 没有缓存，需要请求
        
        // 检查缓存是否过期
        const isExpired = now - cached.timestamp > CACHE_DURATION;
        return isExpired; // 缓存过期，需要请求
      });
      
      if (appsNeedingFetch.length === 0) {
        console.log('[Preloader] 所有应用参数都已缓存且有效，跳过请求');
        return;
      }
      
      console.log(`[Preloader] 需要获取参数的应用: ${appsNeedingFetch.length}个`, appsNeedingFetch.map(app => app.instance_id));
      
      // 分类应用
      const criticalApps: string[] = [];
      const otherApps: string[] = [];
      
      appsNeedingFetch.forEach(app => {
        const metadata = app.config?.app_metadata;
        
        // 当前应用始终是关键应用
        if (app.instance_id === currentAppId) {
          criticalApps.push(app.instance_id);
          return;
        }
        
        // 如果有元数据配置，按配置分类
        if (metadata) {
          // 常用模型是关键应用
          if (metadata.is_common_model) {
            criticalApps.push(app.instance_id);
            return;
          }
          
          // 模型类型的应用优先级较高
          if (metadata.app_type === 'model') {
            criticalApps.push(app.instance_id);
            return;
          }
          
          // 应用市场应用归为其他应用
          if (metadata.app_type === 'marketplace' || metadata.is_marketplace_app) {
            otherApps.push(app.instance_id);
            return;
          }
        }
        
        // 🎯 新增：为没有配置的应用提供智能默认分类
        // 如果没有元数据配置，根据应用名称和ID进行启发式分类
        if (!metadata || Object.keys(metadata).length === 0) {
          const appName = (app.display_name || app.name || app.instance_id).toLowerCase();
          
          // 根据名称关键词判断是否为模型类型
          const modelKeywords = ['gpt', 'claude', 'gemini', 'llama', 'qwen', '通义', '模型', 'model', 'chat', '对话'];
          const isLikelyModel = modelKeywords.some(keyword => appName.includes(keyword));
          
          // 根据名称关键词判断是否为应用市场应用
          const marketplaceKeywords = ['翻译', 'translate', '代码', 'code', '助手', 'assistant', '工具', 'tool', '生成', 'generate'];
          const isLikelyMarketplace = marketplaceKeywords.some(keyword => appName.includes(keyword));
          
          if (isLikelyModel && !isLikelyMarketplace) {
            // 可能是模型，归为关键应用
            criticalApps.push(app.instance_id);
            console.log(`[Preloader] 应用 ${app.instance_id} 无配置，根据名称"${appName}"推断为模型类型，归为关键应用`);
            return;
          } else if (isLikelyMarketplace) {
            // 可能是应用市场应用，归为其他应用
            otherApps.push(app.instance_id);
            console.log(`[Preloader] 应用 ${app.instance_id} 无配置，根据名称"${appName}"推断为应用市场类型，归为其他应用`);
            return;
          } else {
            // 无法判断，默认归为关键应用（保守策略）
            criticalApps.push(app.instance_id);
            console.log(`[Preloader] 应用 ${app.instance_id} 无配置且无法从名称"${appName}"推断类型，默认归为关键应用`);
            return;
          }
        }
        
        // 兜底：其他情况归为关键应用（保守策略）
        criticalApps.push(app.instance_id);
      });
      
      console.log(`[Preloader] 应用分类完成 - 关键应用: ${criticalApps.length}个, 其他应用: ${otherApps.length}个`);
      console.log(`[Preloader] 关键应用列表:`, criticalApps);
      console.log(`[Preloader] 其他应用列表:`, otherApps);
      
      // 第一层：立即加载关键应用
      if (criticalApps.length > 0) {
        console.log('[Preloader] 立即加载关键应用:', criticalApps);
        
        // 并行加载关键应用
        const criticalPromises = criticalApps.map(appId => 
          updatedState.fetchAppParameters(appId).catch((error: any) => {
            console.warn(`[Preloader] 加载关键应用 ${appId} 失败:`, error);
            return null;
          })
        );
        
        await Promise.allSettled(criticalPromises);
        console.log('[Preloader] 关键应用加载完成');
      }
      
      // 第二层：延迟加载其他应用（非阻塞）
      if (otherApps.length > 0) {
        console.log('[Preloader] 延迟加载其他应用:', otherApps);
        
        // 使用setTimeout延迟加载，避免阻塞主线程
        setTimeout(async () => {
          try {
            const finalState = useAppListStore.getState();
            const otherPromises = otherApps.map(appId => 
              finalState.fetchAppParameters(appId).catch((error: any) => {
                console.warn(`[Preloader] 加载应用 ${appId} 失败:`, error);
                return null;
              })
            );
            
            await Promise.allSettled(otherPromises);
            console.log('[Preloader] 其他应用加载完成');
          } catch (error) {
            console.warn('[Preloader] 其他应用加载过程中出错:', error);
          }
        }, 1000); // 延迟1秒加载
      }
      
      console.log('[Preloader] 分层预加载策略执行完成');
    } catch (error) {
      console.error('[Preloader] 预加载失败:', error);
    } finally {
      // 重置预加载状态
      isPreloadingRef.current = false;
    }
  }, []); // 空依赖数组，避免函数重新创建

  // --- BEGIN COMMENT ---
  // 🎯 自动预加载：修复重复请求问题
  // 使用更简单稳定的触发条件，避免状态变化导致重复执行
  // --- END COMMENT ---
  useEffect(() => {
    // 基本条件检查
    const hasUser = !!session?.user;
    const isAppPage = pathname ? ['/chat', '/app'].some(page => pathname.startsWith(page)) : false;
    
    // 如果基本条件不满足，直接返回
    if (!hasUser || !isAppPage) {
      return;
    }
    
    // 如果已经触发过预加载，不再重复触发
    if (hasTriggeredRef.current) {
      console.log('[Preloader] 已经触发过预加载，跳过重复执行');
      return;
    }
    
    // 如果正在加载中，不触发
    if (isLoadingParameters || isPreloadingRef.current) {
      console.log('[Preloader] 正在加载中，跳过触发');
      return;
    }
    
    // 标记已触发，防止重复执行
    hasTriggeredRef.current = true;
    
    console.log('[Preloader] 首次触发预加载');
    triggerPreload();
  }, [
    // 只依赖最基本的条件，避免状态变化导致重复触发
    session?.user,
    pathname,
    isLoadingParameters
  ]);

  // --- BEGIN COMMENT ---
  // 计算预加载进度
  // --- END COMMENT ---
  const getPreloadProgress = useCallback(() => {
    if (apps.length === 0) return { 
      loaded: 0, 
      total: 0, 
      percentage: 0,
      criticalLoaded: 0,
      criticalTotal: 0,
      criticalCompleted: false
    };
    
    const { criticalApps } = categorizeApps();
    const loaded = Object.keys(parametersCache).length;
    const total = apps.length;
    const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
    
    const criticalLoaded = criticalApps.filter(appId => parametersCache[appId]).length;
    const criticalTotal = criticalApps.length;
    const criticalCompleted = criticalTotal > 0 && criticalLoaded === criticalTotal;
    
    return { 
      loaded, 
      total, 
      percentage,
      criticalLoaded,
      criticalTotal,
      criticalCompleted
    };
  }, [apps.length, parametersCache, categorizeApps]);

  // --- BEGIN COMMENT ---
  // 检查特定应用的参数是否已缓存
  // --- END COMMENT ---
  const isAppParametersCached = useCallback((appId: string) => {
    return !!parametersCache[appId];
  }, [parametersCache]);

  // --- BEGIN COMMENT ---
  // 获取特定应用的参数（如果已缓存）
  // --- END COMMENT ---
  const getCachedAppParameters = useCallback((appId: string) => {
    const cached = parametersCache[appId];
    if (!cached) return null;
    
    // 检查是否过期
    const CACHE_DURATION = 5 * 60 * 1000;
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) return null;
    
    return cached.data;
  }, [parametersCache]);

  return {
    // 状态
    isPreloading: isLoadingParameters,
    preloadError: parametersError,
    apps,
    
    // 🎯 新增：预加载激活状态
    isActive: shouldActivatePreloader(),
    
    // 🎯 新增：关键应用加载状态
    isCriticalAppsLoaded: getPreloadProgress().criticalCompleted,
    
    // 进度信息
    progress: getPreloadProgress(),
    
    // 操作方法
    triggerPreload,
    shouldPreload: shouldPreload(),
    
    // 查询方法
    isAppParametersCached,
    getCachedAppParameters,
  };
} 