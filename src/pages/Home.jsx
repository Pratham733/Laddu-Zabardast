import { Fragment } from "react";
import Wrapper from "../components/wrapper/Wrapper";
import Section from "../components/Section";
import { products, discoutProducts } from "../utils/products";
import SliderHome from "../components/Slider";
import useWindowScrollToTop from "../hooks/useWindowScrollToTop";

const Home = () => {
  const newArrivalData = products.filter(
    (item) => item.category === "Laddu" || item.category === "Pickle"
  );
  const bestSales = products.filter((item) => item.category === "Laddu");
  
  useWindowScrollToTop();

  return (
    <Fragment>
      <SliderHome />
      <Wrapper />
      
      {discoutProducts.length > 0 && (
        <Section title="Big Discount" bgColor="#f6f9fc" productItems={discoutProducts} />
      )}

      {newArrivalData.length > 0 && (
        <Section title="New Arrivals" bgColor="white" productItems={newArrivalData} />
      )}

      {bestSales.length > 0 && (
        <Section title="Best Sales" bgColor="#f6f9fc" productItems={bestSales} />
      )}
    </Fragment>
  );
};

export default Home;
