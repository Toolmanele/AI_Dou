import electronService from "./electronService";

function formatPytorchUrl(str, pyTorchsourceUrl, pipSourceUrl) {
  let newStr = str.replace(/{{pytorch_source}}/g, pyTorchsourceUrl);
  // 对于阿里源我们还需要额外的处理,把 --extra-index-url 替换为 -f
  if (pyTorchsourceUrl.includes("aliyun")) {
    newStr = newStr.replace(/--extra-index-url/g, "-f");
  }
  return formatPipUrl(newStr, pipSourceUrl);
}

function formatPipUrl(str, pipSourceUrl) {
  return str.replace(/{{pip_source}}/g, pipSourceUrl);
}

function remove__index_url(str) {
  return str.replace(/--index-url={{.*?}}/g, "");
}
function add__index_url(str, pipSourceUrl) {
  return (str += "--index-url=" + pipSourceUrl);
}
function getSourceUrl(source, type) {
  const sources = {
    pytorch: {
      official: "https://download.pytorch.org/whl",
      aliyun: "https://mirrors.aliyun.com/pytorch-wheels",
    },
    pip: {
      official: "https://pypi.org/simple",
      tsinghua: "https://pypi.tuna.tsinghua.edu.cn/simple",
      aliyun: "https://mirrors.aliyun.com/pypi/simple",
    },
  };

  // Check if the type exists in sources
  if (!sources[type]) {
    return sources.pip.official; // Default to pip official if type doesn't exist
  }

  // Check if the source exists for the given type
  if (!sources[type][source]) {
    return sources[type].official; // Return official source for the given type
  }

  return sources[type][source];
}

function formatCommands(commands, sourceType, source) {
  return commands.map((cmd) => {
    if (sourceType === "pytorch") {
      return formatPytorchUrl(
        cmd,
        getSourceUrl(source, "pytorch"),
        getSourceUrl(source, "pip")
      );
    } else {
      return formatPipUrl(cmd, getSourceUrl(source, "pip"));
    }
  });
}

/**
 * 测试最快的 GitHub 镜像
 * @param {Array<string>} urls - GitHub 镜像 URL 数组
 * @returns {Promise<string>} - 最快的 GitHub 镜像 URL
 */
async function getFastestGithubMirrorUrl(urls) {
  if (!urls || urls.length === 0) {
    return "";
  }

  const result = await electronService.findFastestUrl(urls);
  return result.url || "";
}

/**
 * 测试最快的 PIP 镜像
 * @returns {Promise<string>} - 最快的 PIP 镜像 URL
 */
async function getFastestPipMirrorUrl() {
  const sources = {
    official: "https://pypi.org/simple",
    tsinghua: "https://pypi.tuna.tsinghua.edu.cn/simple",
    aliyun: "https://mirrors.aliyun.com/pypi/simple",
  };

  const urls = Object.values(sources);
  const result = await electronService.findFastestUrl(urls);

  // 根据结果找到对应的源名称
  const fastestUrl = result.url || sources.official;
  // const sourceName = Object.keys(sources).find(
  //   (key) => sources[key] === fastestUrl
  // );
  return fastestUrl;
  // return sourceName || "official";
}

/**
 * 测试最快的 PyTorch 镜像
 * @param {string} type - 镜像类型，默认为 'official'
 * @returns {Promise<string>} - 最快的 PyTorch 镜像源名称
 */
async function getFastestPytorchMirrorUrl(type = "official") {
  const sources = {
    official: "https://download.pytorch.org/whl",
    aliyun: "https://mirrors.aliyun.com/pytorch-wheels",
  };

  const urls = Object.values(sources);
  const result = await electronService.findFastestUrl(urls);

  // 根据结果找到对应的源名称
  const fastestUrl = result.url || sources.official;
  // const sourceName = Object.keys(sources).find(
  //   (key) => sources[key] === fastestUrl
  // );

  return fastestUrl;
}

export default {
  formatPytorchUrl,
  formatPipUrl,
  remove__index_url,
  getSourceUrl,
  formatCommands,
  getFastestGithubMirrorUrl,
  getFastestPipMirrorUrl,
  getFastestPytorchMirrorUrl,
};
