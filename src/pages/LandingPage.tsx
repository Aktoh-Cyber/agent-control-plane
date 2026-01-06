import AgentTypes from '../components/AgentTypes';
import CoreComponents from '../components/CoreComponents';
import Features from '../components/Features';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import PerformanceMetrics from '../components/PerformanceMetrics';
import QuickStart from '../components/QuickStart';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Hero />
      <Features />
      <CoreComponents />
      <PerformanceMetrics />
      <QuickStart />
      <AgentTypes />
      <Footer />
    </div>
  );
};

export default LandingPage;
