import { findFastestUrl } from '../url/findFastestUrl'

let pipMirrors = {
  official: 'https://pypi.org/simple',
  tsinghua: 'https://pypi.tuna.tsinghua.edu.cn/simple',
  aliyun: 'https://mirrors.aliyun.com/pypi/simple'
}

let pytorchMirrors = {
  official: 'https://download.pytorch.org/whl',
  aliyun: 'https://mirrors.aliyun.com/pytorch-wheels'
}
async function getFastestPIPMirrorUrl() {
  const urls = Object.values(pipMirrors)
  const fastestUrl = await findFastestUrl(urls)
  return fastestUrl.url
}
async function getFastestPytorchMirrorUrl() {
  const urls = Object.values(pytorchMirrors)
  const fastestUrl = await findFastestUrl(urls)
  return fastestUrl.url
}
function getSourceUrl(source, type) {
  const sources = {
    pytorch: pytorchMirrors,
    pip: pipMirrors
  }

  // Check if the type exists in sources
  if (!sources[type]) {
    return sources.pip.official // Default to pip official if type doesn't exist
  }

  // Check if the source exists for the given type
  if (!sources[type][source]) {
    return sources[type].official // Return official source for the given type
  }

  return sources[type][source]
}

async function getFinalPipMirrorUrl(source) {
  if (source) {
    return getSourceUrl(source, 'pip')
  } else {
    return await getFastestPIPMirrorUrl()
  }
}
async function getFinalPytorchMirrorUrl() {
  const fastestUrl = await getFastestPytorchMirrorUrl()
  return fastestUrl
}

function formatPipUrl(str, pipSourceUrl) {
  return str.replace(/{{pip_source}}/g, pipSourceUrl)
}

function formatPytorchUrl(str, pyTorchsourceUrl, pipSourceUrl) {
  let newStr = str.replace(/{{pytorch_source}}/g, pyTorchsourceUrl)
  // 对于阿里源我们还需要额外的处理,把 --extra-index-url 替换为 -f
  console.log('pyTorchsourceUrl', pyTorchsourceUrl)
  if (pyTorchsourceUrl.includes('aliyun') !== -1) {
    newStr = newStr.replace(/--extra-index-url/g, '-f')
  }
  return formatPipUrl(newStr, pipSourceUrl)
}

async function formatCommands(commands, sourceType, source) {
  const formattedCommands = []
  for (const cmd of commands) {
    let mirrorPipUrl = await getFinalPipMirrorUrl(source)
    let mirrorPytorchUrl = await getFinalPytorchMirrorUrl(source)
    if (sourceType === 'pytorch') {
      formattedCommands.push(formatPytorchUrl(cmd, mirrorPytorchUrl, mirrorPipUrl))
    } else {
      formattedCommands.push(formatPipUrl(cmd, mirrorPipUrl))
    }
  }
  return formattedCommands
}
export {
  getSourceUrl,
  getFastestPIPMirrorUrl,
  getFinalPytorchMirrorUrl,
  getFinalPipMirrorUrl,
  formatCommands
}
