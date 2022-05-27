const yup = require('yup');

const menteeApplicationSchema = yup.object({
  // profile_id: yup.string().required('profile id required'),
  first_name: yup.string().required('first name required'),
  last_name: yup.string().required('last name required'),
  email: yup.string().email().required('email required'),
  country: yup.string().required('country required'),
  // tech_stack: yup.string().required('tech_stack required'),
});

module.exports = menteeApplicationSchema;
