import React from 'react';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Stats from '../components/landing/Stats';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';
import HowItWorks from '../components/landing/HowItWorks';
import Ecosystem from '../components/landing/Ecosystem';
import Security from '../components/landing/Security';
import MobileApp from '../components/landing/MobileApp';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      <Header />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Ecosystem />
      <Security />
      <MobileApp />
      <CTA />
      <Footer />
    </div>
  );
};

export default Landing; 