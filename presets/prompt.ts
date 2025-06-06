// --- BEGIN COMMENT ---
// 提示模板数据定义
// 从 JSON 文件迁移到 TypeScript 文件以解决类型问题
// --- END COMMENT ---

export interface PromptTemplate {
  id: string;
  title: string;
  prompt: string;
}

export interface PromptCategory {
  id: number;
  title: string;
  icon: string;
  templates: PromptTemplate[];
}

export const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    id: 1,
    title: "提示模板",
    icon: "Sparkles",
    templates: [
      {
        id: "1-1",  
        title: "解释概念",  
        prompt: "请详细解释[概念]的含义，包括其定义、应用场景和重要性。"
      },
      {
        id: "1-2",
        title: "总结要点",
        prompt: "请总结[主题]的主要要点，并列出关键观点。"
      },
      {
        id: "1-3",
        title: "比较不同观点",
        prompt: "请比较[主题]的不同观点，分析各自的优缺点和适用场景。"
      },
      {
        id: "1-4",
        title: "分析问题",
        prompt: "请分析[问题]的原因、影响和可能的解决方案。"
      }
    ]
  },
  {
    id: 2,
    title: "常见问题",
    icon: "HelpCircle",
    templates: [
      {
        id: "2-1",
        title: "学习困难",
        prompt: "我正在学习[主题]，但遇到了困难。请提供一些学习建议和资源推荐。"
      },
      {
        id: "2-2",
        title: "概念混淆",
        prompt: "我对[概念A]和[概念B]的区别感到困惑，请帮我厘清它们之间的关系和区别。"
      },
      {
        id: "2-3",
        title: "应用场景",
        prompt: "请举例说明[概念]在实际中的应用场景和案例。"
      }
    ]
  },
  {
    id: 3,
    title: "教学课件",
    icon: "BookOpen",
    templates: [
      {
        id: "3-1",
        title: "教学大纲",
        prompt: "请为[主题]创建一个详细的教学大纲，包括教学目标、关键内容和学时分配。"
      },
      {
        id: "3-2",
        title: "教学PPT",
        prompt: "请为[主题]设计一个教学幻灯片的内容大纲，包括每页幻灯片的主要内容和设计建议。"
      },
      {
        id: "3-3",
        title: "课堂活动",
        prompt: "请为[主题]设计3-5个互动性强的课堂活动，帮助学生更好地理解和掌握知识点。"
      },
      {
        id: "3-4",
        title: "评估方案",
        prompt: "请为[主题]设计一个全面的学习评估方案，包括形成性评估和总结性评估方法。"
      }
    ]
  },
  {
    id: 4,
    title: "企业资料",
    icon: "Building",
    templates: [
      {
        id: "4-1",
        title: "市场分析",
        prompt: "请对[行业]进行市场分析，包括市场规模、主要参与者、市场趋势和机会挑战。"
      },
      {
        id: "4-2",
        title: "竞品分析",
        prompt: "请对[产品]和主要竞争对手进行对比分析，从产品特性、定价、市场份额和用户评价等方面进行评估。"
      },
      {
        id: "4-3",
        title: "商业计划",
        prompt: "请为[业务/产品]创建一个简要的商业计划大纲，包括价值主张、目标市场、收入模式和实施策略。"
      },
      {
        id: "4-4",
        title: "战略规划",
        prompt: "请帮我制定[企业/项目]的3-5年战略发展规划，包括愿景、目标、核心策略和关键绩效指标。"
      }
    ]
  }
]; 