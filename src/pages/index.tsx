import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

type Topic = {
  title: string;
  description: string;
  to: string;
  meta: string;
  status: 'active' | 'planned';
};

// 주제가 늘어나면 여기에 추가하면 된다.
const TOPICS: Topic[] = [
  {
    title: 'Hermes 에이전트 뜯어보기',
    description:
      '오픈소스 AI 에이전트 Hermes의 내부 구조를 코드 기준으로 분해한 시리즈. Agent Loop, 시스템 프롬프트, 메모리, 위임, 컨텍스트 압축까지.',
    to: '/docs/hermes-agent/01-hermes-overview',
    meta: '14편 · AI 에이전트',
    status: 'active',
  },
];

function Hero() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        <p className={styles.heroEyebrow}>KNOWLEDGE BASE</p>
        <Heading as="h1" className={styles.heroTitle}>
          공부하고, 겪고, 정리한 것들을
          <br />
          한곳에 쌓아둔다.
        </Heading>
        <p className={styles.heroSubtitle}>
          시간순으로 흐르는 블로그가 아니라, 주제별로 깊이 파고들어
          계속 자라는 지식 베이스. 코드를 직접 읽고 검증한 기록을 남긴다.
        </p>
        <div className={styles.heroActions}>
          <Link className={styles.btnPrimary} to="/docs/">
            지식 베이스 둘러보기
          </Link>
          <Link className={styles.btnGhost} to="/log">
            기록 보기
          </Link>
        </div>
      </div>
    </header>
  );
}

function TopicGrid() {
  return (
    <section className={styles.topics}>
      <div className={styles.topicsHead}>
        <Heading as="h2" className={styles.sectionTitle}>
          주제
        </Heading>
        <span className={styles.sectionHint}>
          하나씩 깊이 정리한 시리즈
        </span>
      </div>
      <div className={styles.topicGrid}>
        {TOPICS.map((t) => (
          <Link key={t.title} to={t.to} className={styles.card}>
            <div className={styles.cardMeta}>
              <span className={styles.cardBadge}>{t.meta}</span>
              {t.status === 'active' && (
                <span className={styles.cardDot} aria-label="작성 완료" />
              )}
            </div>
            <h3 className={styles.cardTitle}>{t.title}</h3>
            <p className={styles.cardDesc}>{t.description}</p>
            <span className={styles.cardLink}>읽어보기 →</span>
          </Link>
        ))}
        <div className={clsx(styles.card, styles.cardEmpty)}>
          <div className={styles.cardMeta}>
            <span className={styles.cardBadgeMuted}>다음 주제</span>
          </div>
          <h3 className={styles.cardTitleMuted}>계속 추가됩니다</h3>
          <p className={styles.cardDesc}>
            RAG, LLM 서빙, 그 밖에 공부하는 주제를 여기에 이어서 쌓아둔다.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="공부하고, 겪고, 정리한 것들을 쌓아두는 개인 지식 베이스">
      <Hero />
      <main className={styles.main}>
        <TopicGrid />
      </main>
    </Layout>
  );
}
