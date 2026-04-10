export async function blobUrlToFile(blobUrl, fileName) {
  try {
    // 1. 使用 fetch 获取 Blob URL 的数据
    const response = await fetch(blobUrl);
    
    // 2. 将响应转换为 Blob 对象
    const blob = await response.blob();
    
    // 3. 将 Blob 转换为 File 对象
    // 如果没有提供文件名，可以尝试从 URL 或默认值获取
    const file = new File([blob], fileName || 'file', {
      type: blob.type,
      lastModified: Date.now()
    });
    
    return file;
  } catch (error) {
    console.error('转换失败:', error);
    throw error;
  }
}

//NOTE: You have to implement the funciton.
export async function uploadFileToOSS(
  file: File, 
  onProgress?: (percent: number) => void
): Promise<string> {
  try {
    throw new Error('You have to implement the <uploadFileToOSS> funciton.');
    const host = 'https://oss.pixoclip.com';
    const key = 'no_key.mp4';//must suffix
    return `${host}/${key}`;
  } catch (error) {
    console.error("发生错误:", error);
    throw error;
  }
}