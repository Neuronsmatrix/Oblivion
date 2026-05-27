import { MarketingNav, FeatureGrid, EvidenceBand, MarketingFooter } from './sections';
import { ScrollStory } from './ScrollStory';

export function LandingPage() {
  return (
    <div style={{ background: 'var(--paper)' }}>
      <MarketingNav />
      <ScrollStory />
      <FeatureGrid />
      <EvidenceBand />
      <MarketingFooter />
    </div>
  );
}
