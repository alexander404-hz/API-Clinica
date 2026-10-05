exports.fieldChecker = (errors, cleaned) => (field, result) => {
  if (result.error) {
    errors.push({ field, message: result.error });
  } else if (result.value !== undefined) {
    cleaned[field] = result.value;
  }
};
