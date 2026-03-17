import { apiGet, apiPost, apiPut, apiDelete } from "@/api/utils/apiHelpers";
import type {
  ReviewSkill,
  CreateReviewSkillRequest,
  UpdateReviewSkillRequest,
  PreviewTestResponse,
  ReviewSkillQueryParams,
} from "@/types/center.d";
import { normalizePageParams } from "@/api/utils/pageUtils";

/**
 * 复判技能管理 API
 * 提供多模态复判技能的增删改查操作
 */

/**
 * 复判技能管理 API 类
 */
class ReviewSkillAPI {
  /**
   * 创建多模态复判技能
   * @param skillData 技能数据
   */
  async createReviewSkill(skillData: CreateReviewSkillRequest): Promise<ReviewSkill> {
    if (!skillData.skill_name || !skillData.description || !skillData.prompt_template) {
      return Promise.reject(new Error("缺少必要参数：技能名称、描述和提示词模板"));
    }

    try {
      return await apiPost<ReviewSkill>("/api/v1/llm-skill-review/review-skills", skillData);
    } catch (error) {
      let errorMessage = "创建复判技能失败";
      if (error && typeof error === "object" && "response" in error) {
        const err = error as any;
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * 预览测试复判技能
   * @param testImage 测试图片文件
   * @param userPrompt 用户提示词
   */
  async previewTestReviewSkill(testImage: File, userPrompt: string): Promise<PreviewTestResponse> {
    if (!testImage || !userPrompt) {
      return Promise.reject(new Error("缺少测试图片或用户提示词"));
    }

    const formData = new FormData();
    formData.append("test_image", testImage);
    formData.append("user_prompt", userPrompt);

    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000,
    };

    try {
      return await apiPost<PreviewTestResponse>(
        "/api/v1/llm-skill-review/review-skills/preview-test",
        formData,
        config,
      );
    } catch (error) {
      let errorMessage = "预览测试失败";
      if (error && typeof error === "object" && "response" in error) {
        const err = error as any;
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * 更新复判技能
   * @param skillId 技能ID
   * @param updateData 更新数据
   */
  async updateReviewSkill(skillId: string, updateData: UpdateReviewSkillRequest): Promise<ReviewSkill> {
    if (!skillId) {
      return Promise.reject(new Error("缺少技能ID"));
    }

    try {
      return await apiPut<ReviewSkill>(
        `/api/v1/llm-skill-review/review-skills/${skillId}`,
        updateData,
      );
    } catch (error) {
      let errorMessage = "更新复判技能失败";
      if (error && typeof error === "object" && "response" in error) {
        const err = error as any;
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * 获取复判技能列表
   * @param params 查询参数
   */
  async getReviewSkillList(params: ReviewSkillQueryParams = {}): Promise<ReviewSkill[]> {
    // 复制所有参数并应用分页默认值
    const { page, limit } = normalizePageParams(params);
    const apiParams = {
      ...params,
      page,
      limit: Math.min(limit, 100), // 复判技能列表限制最大值为 100
    };

    // 处理状态过滤参数
    if (apiParams.status !== undefined) {
      if (typeof apiParams.status === "string") {
        if (apiParams.status === "online") {
          apiParams.status = true;
        } else if (apiParams.status === "offline") {
          apiParams.status = false;
        } else {
          delete apiParams.status;
        }
      }
    }

    // 处理名称搜索参数
    if (apiParams.name && typeof apiParams.name === "string") {
      apiParams.name = apiParams.name.trim();
      if (!apiParams.name) {
        delete apiParams.name;
      }
    }

    // 处理标签过滤参数
    if (apiParams.tag && typeof apiParams.tag === "string") {
      apiParams.tag = apiParams.tag.trim();
      if (!apiParams.tag) {
        delete apiParams.tag;
      }
    }

    // 处理前端传递的其他参数名映射
    if (apiParams.searchKeyword) {
      apiParams.name = apiParams.searchKeyword;
      delete apiParams.searchKeyword;
    }

    if (apiParams.selectedCategory) {
      apiParams.tag = apiParams.selectedCategory;
      delete apiParams.selectedCategory;
    }

    if (apiParams.selectedProvider) {
      if (apiParams.selectedProvider === "online") {
        apiParams.status = true;
      } else if (apiParams.selectedProvider === "offline") {
        apiParams.status = false;
      }
      delete apiParams.selectedProvider;
    }

    try {
      return await apiGet<ReviewSkill[]>("/api/v1/llm-skill-review/review-skills", {
        params: apiParams,
      });
    } catch (error) {
      let errorMessage = "获取复判技能列表失败";
      if (error && typeof error === "object" && "response" in error) {
        const err = error as any;
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * 获取复判技能详情
   * @param skillId 技能ID
   */
  async getReviewSkillDetail(skillId: string): Promise<ReviewSkill> {
    if (!skillId) {
      return Promise.reject(new Error("缺少技能ID"));
    }

    try {
      return await apiGet<ReviewSkill>(`/api/v1/llm-skill-review/review-skills/${skillId}`);
    } catch (error) {
      let errorMessage = "获取复判技能详情失败";
      if (error && typeof error === "object" && "response" in error) {
        const err = error as any;
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * 发布复判技能（上线）
   * @param skillId 技能ID
   */
  async publishReviewSkill(skillId: string): Promise<void> {
    if (!skillId) {
      return Promise.reject(new Error("缺少技能ID"));
    }

    try {
      await apiPost<void>(`/api/v1/llm-skill-review/review-skills/${skillId}/publish`);
    } catch (error) {
      let errorMessage = "发布复判技能失败";
      if (error && typeof error === "object" && "response" in error) {
        const err = error as any;
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * 下线复判技能
   * @param skillId 技能ID
   */
  async unpublishReviewSkill(skillId: string): Promise<void> {
    if (!skillId) {
      return Promise.reject(new Error("缺少技能ID"));
    }

    try {
      await apiPost<void>(`/api/v1/llm-skill-review/review-skills/${skillId}/unpublish`);
    } catch (error) {
      let errorMessage = "下线复判技能失败";
      if (error && typeof error === "object" && "response" in error) {
        const err = error as any;
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * 删除复判技能
   * @param skillId 技能ID
   */
  async deleteReviewSkill(skillId: string): Promise<void> {
    if (!skillId) {
      return Promise.reject(new Error("缺少技能ID"));
    }

    try {
      await apiDelete<void>(`/api/v1/llm-skill-review/review-skills/${skillId}`);
    } catch (error) {
      let errorMessage = "删除复判技能失败";
      if (error && typeof error === "object" && "response" in error) {
        const err = error as any;
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * 批量删除复判技能
   * @param skillIds 技能ID数组
   */
  async batchDeleteReviewSkills(skillIds: string[]): Promise<void> {
    if (!skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
      return Promise.reject(new Error("缺少技能ID数组"));
    }

    if (skillIds.length > 50) {
      return Promise.reject(new Error("一次最多删除50个技能"));
    }

    try {
      await apiPost<void>("/api/v1/llm-skill-review/review-skills/batch-delete", skillIds);
    } catch (error) {
      let errorMessage = "批量删除复判技能失败";
      if (error && typeof error === "object" && "response" in error) {
        const err = error as any;
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }
}

// 导出单例实例
export default new ReviewSkillAPI();
