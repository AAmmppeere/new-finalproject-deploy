import React, { useState } from "react";
import Banner from "../components/Banner";
import SearchBar from "../components/Searchbar_user";
import BannerFooter from "../components/BannerFooter";
import Navbar from "../components/Navbar_user";
import Footer from "../components/Footer";

const ServiceList = () => {
  return (
    <>
      <Navbar />
      <Banner />
      <SearchBar />
      <BannerFooter />
      <Footer />
    </>
  );
};

export default ServiceList;
