import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout";
import axios from "axios";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/ProductDetailsStyles.css";
import { useCart } from "../context/cart";

const ProductDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [product, setProduct] = useState(null);
  const [productError, setProductError] = useState("");
  const [relatedProducts, setRelatedProducts] = useState(null);
  const [relatedError, setRelatedError] = useState("");

  //fetch inital product details
  useEffect(() => {
    if (params?.slug) getProduct();
  }, [params?.slug]);

  //getProduct
  const getProduct = async () => {
    setProductError("")
    try {
      const { data } = await axios.get(
        `/api/v1/product/get-product/${params.slug}`
      );
      setProduct(data?.product);
      getSimilarProduct(data?.product._id, data?.product.category._id);
    } catch (error) {
      console.log(error);
      setProductError(error.message);
    }
  };

  //get similar product
  const getSimilarProduct = async (pid, cid) => {
    setRelatedError("")
    try {
      const { data } = await axios.get(
        `/api/v1/product/related-product/${pid}/${cid}`
      );
      setRelatedProducts(data?.products);
    } catch (error) {
      console.log(error);
      setRelatedError(error.message);
    }
  };

  const addToCart = (product) => {
    setCart([...cart, product]);
    localStorage.setItem(
      "cart",
      JSON.stringify([...cart, product])
    );
    toast.success("Item Added to cart");
  };

  return (
    <Layout>
      <div className="row container product-details">
        <div className="col-md-6">
          {
            product && <img
              src={`/api/v1/product/product-photo/${product._id}`}
              className="card-img-top"
              alt={product.name}
              height="300"
              width={"350px"}
            />
          }
        </div>
        <div className="col-md-6 product-details-info">
          <h1 className="text-center">Product Details</h1>
          <hr />
          {
            productError && <h6>Error: {productError}</h6>
          }
          {
            product && <>
              <h6>Name : {product.name}</h6>
              <h6>Description : {product.description}</h6>
              <h6>
                Price :
                {product.price?.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </h6>
              <h6>Category : {product.category?.name}</h6>
              <button 
                className="btn btn-secondary ms-1"
                onClick={() => addToCart(product)}
              >ADD TO CART</button>
            </>
          }
        </div>
      </div>
      <hr />
      <div className="row container similar-products">
        <h4>Similar Products ➡️</h4>
          {
            relatedError 
            ? <h6>Error: {relatedError}</h6>
            : relatedProducts?.length <= 0 && 
              <p className="text-center">No Similar Products found</p>
          }
        <div className="d-flex flex-wrap">
          {relatedProducts?.map((p) => (
            <div className="card m-2" key={p._id}>
              <img
                src={`/api/v1/product/product-photo/${p._id}`}
                className="card-img-top"
                alt={p.name}
              />
              <div className="card-body">
                <div className="card-name-price">
                  <h5 className="card-title">{p.name}</h5>
                  <h5 className="card-title card-price">
                    {p.price.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </h5>
                </div>
                <p className="card-text ">
                  {p.description.substring(0, 60)}...
                </p>
                <div className="card-name-price">
                  <button
                    className="btn btn-info ms-1"
                    onClick={() => navigate(`/product/${p.slug}`)}
                  >
                    More Details
                  </button>
                  <button 
                    className="btn btn-secondary ms-1"
                    onClick={() => addToCart(p)}
                  >ADD TO CART</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetails;