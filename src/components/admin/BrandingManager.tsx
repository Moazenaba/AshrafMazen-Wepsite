import React from 'react';
import { BannerSettings } from './branding/BannerSettings';
import { SocialLinks } from './branding/SocialLinks';
import { ContactSettings } from './branding/ContactSettings';

// The admin's "الواجهة والتواصل" tab: the header (name and logo) and the social links, one file each in ./branding/
export const BrandingManager: React.FC = () => (
  <div className="space-y-10 font-cairo">
    <BannerSettings />
    <ContactSettings />
    <SocialLinks />
  </div>
);
