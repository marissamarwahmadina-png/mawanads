import React from 'react';
import HeroSection from '../components/HeroSection';
import ProblemSection from '../components/ProblemSection';
import SolutionSection from '../components/SolutionSection';
import ServicesOverview from '../components/ServicesOverview';
import AboutSection from '../components/AboutSection';
import WhyWeExist from '../components/WhyWeExist';
import DetailServices from '../components/DetailServices';
import WhitelistEducation from '../components/WhitelistEducation';
import WhitelistDetail from '../components/WhitelistDetail';
import PricingSection from '../components/PricingSection';
import TrustCTA from '../components/TrustCTA';
import ContactSection from '../components/ContactSection';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <ServicesOverview />
      <AboutSection />
      <WhyWeExist />
      <DetailServices />
      <WhitelistEducation />
      <WhitelistDetail />
      <PricingSection />
      <TrustCTA />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Home;