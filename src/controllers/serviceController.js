const servicesService = require("../services/localService");

exports.addService = async (req, res) => {
    try {
        await servicesService.addService(req.body);
        res.json({ message: "New Service added" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getServicesCategoryByArea = async (req, res) => {
    try {
        const area = req.params.area;
        const result = await servicesService.getServicesCategoryByArea(area);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllServicesByArea = async (req, res) => {
    try {
        const area = req.params.area;
        const result = await servicesService.getAllServicesByArea(area);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getServicesByCategoryAndArea = async (req, res) => {
    try {
        const area = req.params.area;
        const category = req.params.category;
        const result = await servicesService.getServicesByCategoryAndArea(area, category);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



