import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// 이 파일은 Node.js에서 실행됩니다 (브라우저 API 사용 불가).

const config: Config = {
  title: '준희의 지식 베이스',
  tagline: '공부하고 정리한 것들을 쌓아두는 곳',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  // GitHub Pages 배포 주소
  url: 'https://jo-on-hee.github.io',
  baseUrl: '/jh-knowledge/',
  organizationName: 'jo-on-hee',
  projectName: 'jh-knowledge',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  onBrokenAnchors: 'warn',

  // 한국어 사이트
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko'],
  },

  // 머메이드 다이어그램 활성화
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  // KaTeX 수식 렌더링용 스타일시트
  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
      type: 'text/css',
      integrity:
        'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV',
      crossorigin: 'anonymous',
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/', // 지식 베이스를 사이트 루트로 (첫 화면 = 문서)
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        blog: false, // 블로그(기록) 기능 미사용 — 순수 지식 베이스
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    // 머메이드 라이트/다크 테마
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
    navbar: {
      title: '준희의 지식 베이스',
      logo: {
        alt: 'logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'knowledgeSidebar',
          position: 'left',
          label: '지식 베이스',
        },
        {
          href: 'https://github.com/jo-on-hee/jh-knowledge',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '지식 베이스',
          items: [
            {label: '전체 목차', to: '/'},
            {label: 'Hermes 에이전트 뜯어보기', to: '/hermes-agent/01-hermes-overview'},
          ],
        },
        {
          title: '링크',
          items: [
            {label: 'GitHub', href: 'https://github.com/jo-on-hee/jh-knowledge'},
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} 준희의 지식 베이스`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'python', 'json', 'yaml', 'sql'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
