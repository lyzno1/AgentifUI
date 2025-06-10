import { Metadata } from 'next'
import OrganizationsManagement from '@components/admin/organizations'

export const metadata: Metadata = {
  title: '组织管理 - AgentifUI 管理后台',
  description: '管理组织结构、部门和成员关系',
}

export default function OrganizationsPage() {
  return <OrganizationsManagement />
} 