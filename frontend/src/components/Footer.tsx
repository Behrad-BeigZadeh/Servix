import React from "react";
import { Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-zinc-900 text-zinc-200 py-10 mt-15">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div>
          <h2 className="text-xl font-bold mb-2">Servix</h2>
          <p className="text-sm text-zinc-400">
            Connecting people with trusted service providers.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Services</h3>
          <ul className="space-y-1 text-sm text-zinc-400">
            <li>
              <a href="#" className="hover:underline">
                Home Cleaning
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Pet Sitting
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Private Tutoring
              </a>
            </li>
            <li>
              <a
                href="#"
                className="hover:underline opacity-50 cursor-not-allowed"
                title="Coming soon"
              >
                More...
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Company</h3>
          <ul className="space-y-1 text-sm text-zinc-400">
            <li>
              <a href="#" className="hover:underline">
                About Us
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Careers
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Contact
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Help Center
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Follow Us</h3>
          <div className="flex space-x-4 justify-center items-center">
            <a href="#" title="Facebook (Coming soon)">
              <Facebook className="w-5 h-5 hover:text-white cursor-pointer opacity-50" />
            </a>
            <a href="#" title="Twitter (Coming soon)">
              <Twitter className="w-5 h-5 hover:text-white cursor-pointer opacity-50" />
            </a>
            <a href="#" title="Instagram (Coming soon)">
              <Instagram className="w-5 h-5 hover:text-white cursor-pointer opacity-50" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center text-sm text-zinc-500">
        &copy; {new Date().getFullYear()} Servix. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
