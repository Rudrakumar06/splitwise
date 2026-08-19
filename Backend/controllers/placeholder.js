function endpointPlaceholder(endpoint) {
  return (_req, res) => {
    res.status(501).json({
      message: 'Endpoint structure created',
      endpoint,
      implementationStatus: 'placeholder',
    });
  };
}

module.exports = endpointPlaceholder;
