## Features & Functionality

This application is a departmental production dashboard (SPATRAC) designed for food production environments, supporting multiple departments such as Butchery, Bakery, and HMR. It provides a comprehensive workflow for recipe management, production scheduling, auditing, and staff coordination.

### Core Features

- **Dashboard Overview**  
  A central dashboard displays department-specific production stats and quick actions.

- **Recipe Management**  
  - Create, edit, and list recipes per department.
  - Specify ingredients, quantities, units, and supplier associations.
  - Filter recipes by department.

- **Consolidated Production Scheduling**  
  - Schedule recipes for production with an interactive calendar interface.
  - Drag and drop time slots for easy scheduling.
  - Adjust production quantities in real-time with improved input validation.
  - Assign staff and managers to scheduled runs.
  - Export schedules as needed.
  - All scheduling functionality consolidated in one place for better user experience.

- **Production Document Creation**  
  - Auto-populate production documents from scheduled recipes.
  - Capture batch codes, sell-by dates, and ingredient traceability.
  - Ensure all required data for compliance and auditing is collected.
  - Real-time updates when recipes are scheduled or confirmed.

- **Audit & Compliance**  
  - View, filter, and export production audit records.
  - Preview detailed audit data, including supplier and origin information for each ingredient.
  - Integrated audit workflow with scheduling and production.

- **Supplier & Product Mapping**  
  - Flexible mapping of products and suppliers to departments.
  - Supports products available across multiple departments with department-specific supplier codes.
  - Automatic calculation of ingredient quantities based on production volume.

- **Staff Management**  
  - Assign and manage department staff and handlers for production runs.
  - Optimized performance with React hooks (useCallback, useMemo).
  - Improved state management to prevent unnecessary re-renders.

- **User Experience**  
  - Modern, responsive UI built with Material-UI and React.
  - Department color-coding and context-aware navigation.
  - Modal dialogs for confirmations, previews, and exports.
  - Event-driven architecture for real-time updates across components.
  - Improved error handling and API interaction.

### Technical Stack

- **Frontend:** React (Create React App), Material-UI
- **State Management:** React Hooks
- **API Integration:** RESTful endpoints via `src/services/api.js`
- **Mock Data:** Local JSON files for suppliers, departments, and products
- **Testing:** Jest (via Create React App)

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Environment Variables

Copy `.env.example` to `.env` at the project root and set `REACT_APP_API_BASE` to your API base URL (e.g., http://localhost:5000).

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
