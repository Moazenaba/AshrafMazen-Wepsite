import React from 'react';
import { BannerSettings } from './branding/BannerSettings';
import { NameFontSettings } from './branding/NameFontSettings';
import { SocialLinks } from './branding/SocialLinks';
import { ContactSettings } from './branding/ContactSettings';
import { HomeFeatureSettings } from './branding/HomeFeatureSettings';
import { SideMenuSettings } from './branding/SideMenuSettings';
import { LiveStreamSettings } from './branding/LiveStreamSettings';
import { WelcomeSoundSettings } from './branding/WelcomeSoundSettings';

// The admin's "الواجهة والتواصل" tab: the header (name and logo) and the social links, one file each in ./branding/
export const BrandingManager: React.FC = () => (
  <div className="space-y-10 font-cairo">
    <LiveStreamSettings />
    <BannerSettings />
    <NameFontSettings />
    <HomeFeatureSettings />
    <SideMenuSettings />
    <WelcomeSoundSettings />
    <ContactSettings />
    <SocialLinks />
  </div>
);
