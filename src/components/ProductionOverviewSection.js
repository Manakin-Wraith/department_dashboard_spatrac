import React from 'react';

const ProductionOverviewSection = ({ overview, setOverview }) => {
  const handleChange = e => {
    const { name, value } = e.target;
    setOverview(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="production-overview-section">
      <h2>Production Overview</h2>
      <label>
        Department:
        <select name="department" value={overview.department} onChange={handleChange}>
          <option value="">Select department</option>
          <option value="Butchery">Butchery</option>
          <option value="Bakery">Bakery</option>
          <option value="HMR">HMR</option>
        </select>
      </label>
      <label>
        Department Manager:
        <input type="text" name="department_manager" value={overview.department_manager} onChange={handleChange} />
      </label>
      <label>
        Food Handler(s):
        <input
          type="text"
          name="food_handler_responsible"
          value={overview.food_handler_responsible}
          onChange={handleChange}
          placeholder="Comma separated"
        />
      </label>
      <label>
        Final Product Name:
        <input type="text" name="product_name" value={overview.product_name} onChange={handleChange} />
      </label>
      <label>
        Planned Batch Code(s):
        <input
          type="text"
          name="packing_batch_code"
          value={overview.packing_batch_code}
          onChange={handleChange}
          placeholder="Comma separated"
        />
      </label>
      <label>
        Planned Sell-by Date:
        <input type="date" name="sell_by_date" value={overview.sell_by_date} onChange={handleChange} />
      </label>
    </div>
  );
};

export default ProductionOverviewSection;
