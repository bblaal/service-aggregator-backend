const deliveryService = require("../services/deliveryService");

exports.createAgent = async (req, res, next) => {
  try {
    // image path
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/globalMenu/${req.file.filename}`;
    }
    const { name, age, address, mobile, blood_group,
      license_no,
      bike_no, area } = req.body;

    const agent = await deliveryService.createAgent(
      name,
      age,
      address,
      mobile,
      blood_group,
      license_no,
      bike_no,
      area,
      imageUrl
    );
    res.status(201).json(agent);
  } catch (err) {
    next(err);
  }
};

exports.fetchAllAgents = async (req, res, next) => {
  try {
    const { area } = req.query;
    const agents = await deliveryService.fetchAllAgents(area);
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createDelivery = async (req, res, next) => {
  try {
    const { orderId, agentId } = req.body;
    const delivery = await deliveryService.createDelivery(orderId, agentId);
    res.status(201).json(delivery);
  } catch (err) {
    next(err);
  }
};

exports.updateDeliveryLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;
    const updated = await deliveryService.updateDeliveryLocation(Number(id), lat, lng);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.getDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const delivery = await deliveryService.getDelivery(Number(id));
    res.json(delivery);
  } catch (err) {
    next(err);
  }
};
