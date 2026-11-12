import React from 'react';
import { BannerSettings } from './branding/BannerSettings';
import { SocialLinks } from './branding/SocialLinks';
import { ContactSettings } from './branding/ContactSettings';
import { HomeFeatureSettings } from './branding/HomeFeatureSettings';
import { SideMenuSettings } from './branding/SideMenuSettings';

// The admin's "الواجهة والتواصل" tab: the header (name and logo) and the social links, one file each in ./branding/
export const BrandingManager: React.FC = () => (
  <div className="space-y-10 font-cairo">
    <BannerSettings />
    <HomeFeatureSettings />
    <SideMenuSettings />
    <ContactSettings />
    <SocialLinks />
  </div>
);
