import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { saveProductionDoc } from '../services/api';
import ProductionOverviewSection from './ProductionOverviewSection';
import IngredientDetailsSection from './IngredientDetailsSection';
import FormActions from './FormActions';

const ProductionForm = () => {
  const [overview, setOverview] = useState({
    department: '',
    department_manager: '',
    food_handler_responsible: '',
    product_name: '',
    packing_batch_code: '',
    sell_by_date: ''
  });

  const [ingredients, setIngredients] = useState([
    {
      ingredient: '',
      batch_code: '',
      qty_used: '',
      supplier_name: '',
      receiving_date: '',
      sell_by_date: '',
      country_of_origin: ''
    }
  ]);

  const { department } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await saveProductionDoc(department, overview, ingredients);
      navigate(`/production/${department}/audit`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ProductionOverviewSection overview={overview} setOverview={setOverview} />
      <IngredientDetailsSection ingredients={ingredients} setIngredients={setIngredients} />
      <FormActions />
    </form>
  );
};

export default ProductionForm;
