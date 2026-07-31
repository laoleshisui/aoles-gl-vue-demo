import { uniSourceMap, processPaths, extractFileExtension } from '@aoles-gl/vue'
import { uploadFileToOSS } from './oss';
import axios from 'axios';

export async function GLControllerExport (controllerJson) {
  console.log('视频配置:', controllerJson, uniSourceMap);
  
  await processPaths(controllerJson, ['path', 'font_path', 'glsl_path'], async (path:string, parent)=>{
    console.log("parent: ", parent);
    for (let i = uniSourceMap.length - 1; i >= 0; i--) {
        if (uniSourceMap[i].wasmPath === path) {
          const url = await uploadFileToOSS(uniSourceMap[i].file);
          return url;
        }
      }
      return;
    });

//   const response = await fetch('/api/custom-generate', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(controllerJson)
//   })
  
  const result = await glConrtollerPost(controllerJson);
  console.log('生成结果:', result);
}

//TODO: render in server.
export async function glConrtollerPost(controller_json) {
  const url = "/gl-controller";
  
  const payload = controller_json;

  if(!payload){
    console.error("payload is null.");
    return;
  }

  console.log("request: ", JSON.stringify(payload));

  return await axios.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
    }
  });
}