<script setup>
import { computed } from 'vue'
import release from '../../../release.json'
import projectImage from '../../images/project.png'

const props = defineProps({ lang: { type: String, default: 'en' } })
const zh = computed(() => props.lang === 'zh')
const link = path => `/${props.lang}/${path}.html`
const commands = 'chmod +x ./ScienceDiscovery && ./ScienceDiscovery serve'
const cards = computed(() => zh.value ? [
  ['01', '完成第一次任务', '从安装、模型配置到发起科研任务，跟随教程走完第一步。', 'tutorial/01-quick-start', '开始使用'],
  ['02', '选择部署方式', '二进制、Docker 或本地源码。查看每种方式的前置条件与完整命令。', 'how-to/deployment', '阅读部署指南'],
  ['03', '探索用户文档', '教程、操作指南、参数参考与原理解释，按当前需要查阅。', 'README', '浏览中文文档']
] : [
  ['01', 'Complete your first task', 'Go from installation and model configuration to your first research task.', 'tutorial/01-quick-start', 'Follow the quick start'],
  ['02', 'Choose your deployment', 'Binary, Docker, or local source. Find requirements and complete commands for each path.', 'how-to/deployment', 'Read the deployment guide'],
  ['03', 'Explore the documentation', 'Tutorials, how-to guides, reference, and explanations, organized around what you need.', 'README', 'Browse the documentation']
])
</script>

<template>
  <main class="landing">
    <section class="hero" aria-labelledby="hero-title">
      <div class="eyebrow"><span class="status-dot" /> SCIENCEDISCOVERY <span class="version">v{{ release.version }}</span></div>
      <h1 id="hero-title">{{ zh ? '面向科学研究' : 'A workspace for' }}<br><span>{{ zh ? '的一站式工作台。' : 'scientific research.' }}</span></h1>
      <p class="hero-description">{{ zh ? '在同一个工作空间中完成文献调研、代码开发与实验探索，让科研过程与产出可追溯。' : 'Bring literature review, code development, and experiments into one workspace, with traceable research workflows and results.' }}</p>
      <div id="download" class="download-block">
        <p class="download-label">{{ zh ? '下载 0.2.0' : 'Download 0.2.0' }} <span>Linux only · {{ zh ? '需要 bubblewrap' : 'Requires bubblewrap' }}</span></p>
        <div class="download-actions">
          <a v-for="asset in release.binaries" :key="asset.arch" class="download-button" :href="asset.url">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5" /></svg>
            <span>Linux {{ asset.arch }}<small>{{ asset.arch === 'x86_64' ? 'Intel / AMD · 64-bit' : 'ARM · 64-bit' }}</small></span>
          </a>
        </div>
        <a class="release-link" :href="release.url">{{ zh ? '版本说明与全部资产' : 'Release notes & all assets' }} <span aria-hidden="true">↗</span></a>
      </div>
    </section>

    <section class="start-panel" aria-labelledby="start-title">
      <div class="start-copy"><span class="section-label">{{ zh ? '从这里开始' : 'UP AND RUNNING' }}</span><h2 id="start-title">{{ zh ? '下载，然后启动。' : 'Download. Then launch.' }}</h2><p>{{ zh ? '按 CPU 架构选择上方二进制，将下载的文件重命名为 ScienceDiscovery。安装 bubblewrap 后运行：' : 'Choose the binary for your CPU above and rename the downloaded file to ScienceDiscovery. Install bubblewrap, then run:' }}</p><a :href="link('how-to/deployment')">{{ zh ? '查看安装前置条件' : 'See installation requirements' }} <span aria-hidden="true">→</span></a></div>
      <div class="terminal"><div class="terminal-title"><span>TERMINAL</span><span>Linux</span></div><pre><code>{{ commands }}</code></pre><div class="terminal-note"><span class="status-dot" />http://127.0.0.1:4310</div><p>{{ zh ? '打开终端输出的「Open to sign in」链接登录，然后在系统配置中添加任务模型。' : 'Open the “Open to sign in” URL printed in your terminal, then configure a task model in System configuration.' }}</p></div>
    </section>

    <section class="paths" :aria-label="zh ? '入门与文档' : 'Get started and learn'">
      <a v-for="card in cards" :key="card[0]" class="path-card" :href="link(card[3])"><span class="card-number">{{ card[0] }}</span><h2>{{ card[1] }}</h2><p>{{ card[2] }}</p><span class="card-link">{{ card[4] }} <span aria-hidden="true">→</span></span></a>
    </section>

    <section class="workspace-preview" aria-labelledby="workspace-title">
      <div><span class="section-label">{{ zh ? '你的科研工作空间' : 'YOUR RESEARCH WORKSPACE' }}</span><h2 id="workspace-title">{{ zh ? '从一个问题开始。' : 'Start with a question.' }}</h2><p>{{ zh ? '在项目中组织研究，通过任务、工具和科学连接器推进工作。查看文献调研案例，了解从配置到结果的完整过程。' : 'Organize your research in projects and work through tasks with tools and scientific connectors. Follow the literature research case from setup to results.' }}</p><a :href="link('how-to/literature-research-case-guide')">{{ zh ? '阅读文献调研案例' : 'Read the literature research case' }} <span aria-hidden="true">→</span></a></div>
      <figure><img :src="projectImage" :alt="zh ? 'ScienceDiscovery 项目配置界面，来自用户指南' : 'ScienceDiscovery project configuration, from the user guide'" loading="lazy"><figcaption>{{ zh ? '用户指南中的项目配置示例' : 'Project configuration example from the user guide' }}</figcaption></figure>
    </section>

    <section class="release-details" :aria-label="zh ? '发布信息' : 'Release information'">
      <details><summary>{{ zh ? '校验下载文件 · SHA256' : 'Verify your download · SHA256' }}</summary><p>{{ zh ? '以下校验值来自 GitHub Release 资产元数据。使用 sha256sum 检查下载的文件，结果应与相应架构一致。' : 'These checksums come from the GitHub Release asset metadata. Run sha256sum on the downloaded file and compare the result for your architecture.' }}</p><div v-for="asset in release.binaries" :key="asset.arch" class="checksum"><strong>{{ asset.name }}</strong><code>{{ asset.sha256 }}</code></div></details>
      <p>{{ zh ? '二进制下载固定为 0.2.0；用户文档同步自产品主干，可能包含后续更新。' : 'Binary downloads are pinned to 0.2.0. The documentation follows the product main branch and may include later updates.' }} <a :href="release.url">{{ zh ? '查看 0.2.0 发布说明' : 'See the 0.2.0 release notes' }}</a></p>
    </section>
  </main>
</template>
