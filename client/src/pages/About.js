import React from "react";
import Layout from "./../components/Layout";

// AI attribution: OpenAI ChatGPT(GPT-5) via cursor was used to help debugging and generate fake "About us " content .

const About = () => {
  return (
    <Layout title={"About us - Ecommerce app"}>
      <section className="about-section">
        <div className="row about-us">
          <div className="col-md-6">
            <img
              src="/images/about.jpeg"
              alt="About us"
              style={{ width: "100%" }}
            />
          </div>
          <div className="col-md-6">
            <h1 className="text-center mb-4">About Us</h1>
            <h2 className="mb-3">Our Story</h2>
            <p className="text-justify mt-2">
              Welcome to Virtual Vault, your premier destination for quality products and exceptional service. 
              We are a leading e-commerce platform dedicated to providing our customers with the best shopping experience.
            </p>
            <h3 className="mt-4 mb-3">Our Mission</h3>
            <p className="text-justify">
              Our mission is to make quality products accessible to everyone while maintaining the highest standards 
              of customer service and satisfaction. We believe in building lasting relationships with our customers 
              through trust, reliability, and innovation.
            </p>
            <h3 className="mt-4 mb-3">Why Choose Us?</h3>
            <ul className="list-unstyled">
              <li className="mb-2">✓ Quality products from trusted brands</li>
              <li className="mb-2">✓ Fast and reliable shipping</li>
              <li className="mb-2">✓ 24/7 customer support</li>
              <li className="mb-2">✓ Secure payment processing</li>
              <li className="mb-2">✓ Easy returns and exchanges</li>
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;