"use client"
import { Plus, PanelLeftClose, PanelLeft, Store } from "lucide-react"
import { SidebarButton } from "./sidebar-button"
import { useSidebarStore } from "@lib/stores/sidebar-store"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"
import { useRouter } from "next/navigation"
import { useChatStore } from "@lib/stores/chat-store"
import { useChatInputStore } from "@lib/stores/chat-input-store"
import { useChatTransitionStore } from "@lib/stores/chat-transition-store"
import { Grid3x3, AppWindow, Blocks } from "lucide-react"

export function SidebarHeader() {
  const { isExpanded, isLocked, toggleSidebar } = useSidebarStore()
  const { isDark } = useTheme()
  const router = useRouter()
  
  const setCurrentConversationId = useChatStore((state) => state.setCurrentConversationId)
  const clearMessages = useChatStore(state => state.clearMessages)
  const setIsWaitingForResponse = useChatStore(state => state.setIsWaitingForResponse)
  const { setIsWelcomeScreen } = useChatInputStore()
  const { setIsTransitioningToWelcome } = useChatTransitionStore()

  return (
    <div className={cn(
      "flex flex-col gap-2 py-4 px-3",
    )}>
      {/* 展开/关闭按钮 */}
      <div
        role="button"
        tabIndex={0}
        onClick={toggleSidebar}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleSidebar();
          }
        }}
        aria-label={
          !isLocked 
            ? "锁定侧栏" 
            : (isExpanded ? "解锁并收起侧栏" : "展开侧栏")
        }
        className={cn(
          "relative flex items-center rounded-lg px-3 py-2 text-sm font-medium",
          "transition-all duration-200 ease-in-out cursor-pointer",
          "outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          isDark ? "focus-visible:ring-stone-500 focus-visible:ring-offset-gray-900" : "focus-visible:ring-primary focus-visible:ring-offset-background",
          "border border-transparent",
          "h-10 min-h-[2.5rem]",
          isDark ? [
            "text-gray-200",
            "hover:bg-stone-600 hover:shadow-md hover:border-stone-500/50",
            isLocked && "bg-stone-700 shadow-sm border-stone-600",
          ] : [
            "text-stone-600",
            "hover:bg-stone-300 hover:shadow-md",
            isLocked && "bg-stone-300 shadow-sm border-stone-400/80",
          ],
          isExpanded ? "w-full" : "w-10 justify-center",
        )}
      >
        <div className="flex flex-1 items-center min-w-0">
          <span className={cn(
            "flex h-5 w-5 items-center justify-center -ml-0.5 flex-shrink-0", 
            isDark ? "text-gray-400" : "text-gray-500",
          )}>
            {isLocked && isExpanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </span>
          {isExpanded && (
            <div className={cn(
              "ml-2 flex-1 min-w-0 truncate font-serif",
              "flex items-center leading-none"
            )}>
              {!isLocked 
                ? "锁定侧栏" 
                : (isExpanded ? "解锁并收起" : "展开侧栏")
              }
            </div>
          )}
        </div>
      </div>
      
      {/* 🎯 发起新对话按钮 - 重要功能，适中的视觉突出度 */}
      <SidebarButton
        icon={<Plus className={cn(
          "h-5 w-5 transition-transform duration-200 group-hover:rotate-90",
          isDark
            ? "text-stone-100"
            : "text-stone-100"
        )} />}
        disableLockBehavior={true}
        onClick={() => {
          const isAlreadyOnNewChat = window.location.pathname === '/chat/new';
          if (isAlreadyOnNewChat) {
            return;
          }
          
          const { isHovering, setHovering } = useSidebarStore.getState();
          if (isHovering) {
            setHovering(false);
          }
          
          router.push('/chat/new');
          
          useChatStore.getState().clearMessages();
          clearMessages();
          setCurrentConversationId(null);
          setIsWelcomeScreen(true);
          setIsTransitioningToWelcome(true);
          setIsWaitingForResponse(false);
          
          const { selectItem } = useSidebarStore.getState();
          selectItem('chat', null, true);
        }}
        aria-label="发起新对话"
        className={cn(
          "group font-medium transition-all duration-200",
          isDark 
            ? [
              "bg-stone-700/80 hover:bg-stone-600/90",
              "border border-stone-600/60 hover:border-stone-500/80",
              "text-stone-100 hover:text-white",
              "shadow-md shadow-stone-900/20 hover:shadow-lg hover:shadow-stone-900/30"
            ]
            : [
              "bg-stone-600/90 hover:bg-stone-500/95",
              "border border-stone-500/60 hover:border-stone-400/80",
              "text-white",
              "shadow-md shadow-stone-900/15 hover:shadow-lg hover:shadow-stone-900/25"
            ]
        )}
      >
        <span className="font-serif">发起新对话</span>
      </SidebarButton>

      {/* 🎯 应用市场按钮 - 次要功能，更轻量的视觉设计 */}
      <SidebarButton
        icon={
          <Blocks className={cn(
            "h-5 w-5 transition-colors duration-200",
            isDark ? "text-stone-400 group-hover:text-stone-200" : "text-stone-600 group-hover:text-stone-700"
          )} />
        }
        disableLockBehavior={true}
        onClick={() => {
          router.push('/apps');
        }}
        aria-label="应用市场"
        className={cn(
          "group font-medium transition-all duration-200",
          isDark
            ? [
              "bg-stone-800/60 hover:bg-stone-700/80",
              "border border-stone-700/40 hover:border-stone-600/60",
              "text-stone-300 hover:text-stone-100",
              "shadow-sm shadow-stone-900/10 hover:shadow-md hover:shadow-stone-900/20"
            ]
            : [
              "bg-stone-300/90 hover:bg-stone-400/95",
              "border border-stone-400/50 hover:border-stone-500/70",
              "text-stone-700 hover:text-stone-800",
              "shadow-sm shadow-stone-900/8 hover:shadow-md hover:shadow-stone-900/15"
            ]
        )}
      >
        <span className="font-serif">应用市场</span>
      </SidebarButton>

    </div>
  )
}