import type { DramaActingNote, DramaCharacterRef, DramaDialogue, DramaStoryboard, DramaStoryboardSaveReq } from '@/api/ai/drama/storyboard'

/** 镜头编辑表单：与 PC 端 StoryboardFields 的字段一致，其它字段保存时原样保留 */
export interface ShotForm {
  sceneNo?: number // 镜头序号
  title?: string // 标题
  sceneType?: number // 场景类型
  shotType?: string // 景别
  cameraMove?: string // 运镜
  duration?: number // 时长（秒）
  sceneText?: string // 画面描述
  dialogues: DramaDialogue[] // 台词
  actingNotes: DramaActingNote[] // 表演指导
  imagePrompt?: string // 关键帧提示词
  videoPrompt?: string // 视频提示词
  locationId?: number // 场景
  characters: DramaCharacterRef[] // 出场角色：形象与站位
  propsAuto: boolean // 道具按关联的镜头自动选择：提交时道具为空
  visualAssetIds: number[] // 指定的道具；不自动选择时有效，空数组表示没有道具
  referenceVideoUrls: string[] // 动作参考视频
  materialUrls: string[] // 素材图片
  manualStartFrameUrl: string // 手动起始帧：提交时转为连续性设置的 manualStartFrame
  videoModelId?: number // 视频模型；为空跟随默认
  videoResolution?: string // 分辨率；为空跟随默认
  useFirstFrame: boolean // 是否使用起始帧
  includeLocation: boolean // 参考图是否包含场景
}

/** 创建表单：传入镜头时复制其字段，修改不影响详情；为空时为新增，镜头序号默认排在最后 */
export function createShotForm(storyboard?: DramaStoryboard, defaultSceneNo?: number): ShotForm {
  const continuity = storyboard?.continuity
  return {
    sceneNo: storyboard ? storyboard.sceneNo : defaultSceneNo,
    title: storyboard?.title,
    sceneType: storyboard?.sceneType,
    shotType: storyboard?.shotType,
    cameraMove: storyboard?.cameraMove,
    duration: storyboard?.duration || 5,
    sceneText: storyboard?.sceneText,
    dialogues: (storyboard?.dialogues || []).map(item => ({ ...item })),
    actingNotes: (storyboard?.actingNotes || []).map(item => ({ ...item })),
    imagePrompt: storyboard?.imagePrompt,
    videoPrompt: storyboard?.videoPrompt,
    locationId: storyboard?.locationId,
    characters: (storyboard?.characters || []).map(item => ({ ...item })),
    propsAuto: !storyboard?.visualAssetIds,
    visualAssetIds: [...(storyboard?.visualAssetIds || [])],
    referenceVideoUrls: [...(continuity?.referenceVideoUrls || [])],
    materialUrls: [...(continuity?.materialUrls || [])],
    manualStartFrameUrl: continuity?.manualStartFrame?.url || '',
    videoModelId: storyboard?.videoModelId || undefined,
    videoResolution: storyboard?.videoResolution || undefined,
    useFirstFrame: continuity?.useFirstFrame !== false,
    includeLocation: continuity?.includeLocation !== false,
  }
}

/** 构建提交的数据：修改时以原镜头为底，未在表单编辑的字段原样保留 */
export function buildShotSaveReq(form: ShotForm, projectId: number, base?: DramaStoryboard): DramaStoryboardSaveReq {
  return {
    ...base,
    projectId,
    sceneNo: form.sceneNo,
    title: form.title,
    sceneType: form.sceneType,
    shotType: form.shotType,
    cameraMove: form.cameraMove,
    duration: form.duration,
    sceneText: form.sceneText,
    dialogues: form.dialogues.filter(item => item.line?.trim()),
    actingNotes: form.actingNotes.filter(item => item.acting?.trim()),
    imagePrompt: form.imagePrompt,
    videoPrompt: form.videoPrompt,
    locationId: form.locationId,
    characters: form.characters.filter(item => item.appearanceId),
    // 为空表示按道具关联的镜头序号；空数组表示没有道具
    visualAssetIds: form.propsAuto ? undefined : form.visualAssetIds,
    continuity: {
      ...base?.continuity,
      useFirstFrame: form.useFirstFrame,
      includeLocation: form.includeLocation,
      referenceVideoUrls: form.referenceVideoUrls,
      materialUrls: form.materialUrls,
      manualStartFrame: form.manualStartFrameUrl ? { url: form.manualStartFrameUrl } : undefined,
    },
    videoModelId: form.videoModelId,
    // 视频模型为空时清空，生成时使用默认的视频模型；分辨率空串表示不传
    videoResolution: form.videoModelId ? form.videoResolution || '' : '',
  }
}
