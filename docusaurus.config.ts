import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// 이 파일은 Node.js에서 실행됩니다 (브라우저 API 사용 불가).

const config: Config = {
  title: '준희의 지식 베이스',
  tagline: '공부하고, 겪고, 정리한 것들을 쌓아두는 곳',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  // 배포 주소 (GitHub Pages 사용 시 아래 두 값을 본인 것으로 바꾸면 됨)
  url: 'https://jo-on-hee.github.io',
  baseUrl: '/jh-knowledge/',

  // GitHub Pages 배포 설정 (나중에 본인 값으로)
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

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs', // 지식 베이스 본문
          // editUrl 제거 (개인용이라 "이 페이지 편집" 링크 불필요)
        },
        blog: {
          showReadingTime: true,
          routeBasePath: 'log', // 시간순 기록(짧은 메모·회고)은 /log 로
          blogTitle: '기록',
          blogDescription: '그때그때의 메모와 회고',
          postsPerPage: 10,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'ignore',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
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
        {to: '/log', label: '기록', position: 'left'},
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
            {label: '시작하기', to: '/docs/'},
            {label: 'Hermes 에이전트 뜯어보기', to: '/docs/hermes-agent/01-hermes-overview'},
          ],
        },
        {
          title: '더 보기',
          items: [
            {label: '기록', to: '/log'},
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
