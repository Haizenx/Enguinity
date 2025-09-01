import Quotation from "../models/quotation.model.js";

export const createQuotation = async (req, res) => {
  try {
    const { projectTitle, clientName, location, items } = req.body;
    const quotation = new Quotation({ projectTitle, clientName, location, items });
    await quotation.save();
    res.status(201).json(quotation);
  } catch (error) {
    console.error("Error creating quotation:", error);
    res.status(500).json({ message: "Failed to create quotation", error: error.message });
  }
};

export const getQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find().populate({
      path: 'items.item',
      model: 'Item'
    });
    res.json(quotations);
  } catch (error) {
    console.error("Error fetching quotations:", error);
    res.status(500).json({ message: "Failed to fetch quotations", error: error.message });
  }
};

export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate({
      path: 'items.item',
      model: 'Item'
    });
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    res.json(quotation);
  } catch (error) {
    console.error("Error fetching quotation:", error);
    res.status(500).json({ message: "Failed to fetch quotation", error: error.message });
  }
};

