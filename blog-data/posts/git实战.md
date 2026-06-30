# 实战一


实现将本地项目上传到github上，本地项目目录，Flink-Study。



## github网站上创建flink-study仓库

略


## 命令行工具通过win终端创建

安装 GitHub CLI：


- [GitHub CLI 的官方网站](https://cli.github.com/) 下载和安装。



登录 GitHub CLI：


- gh auth login



创建新的仓库：


- gh repo create  --public



使用 GitHub API(另一种方式)


- curl -H "Authorization: token YOUR_GITHUB_TOKEN" \      -d '&#123;"name": "YOUR_REPO_NAME", "private": false&#125;' \      https://api.github.com/user/repos

