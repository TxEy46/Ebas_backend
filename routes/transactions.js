const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// 📋 GET transactions
router.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .order("createdate", { ascending: false });

        if (error) {
            console.log("DB fetch error:", error);
            return res.status(500).json({ message: "DB error" });
        }
        res.json(data);
    } catch (err) {
        console.log("Server error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ➕ POST (Create) transaction
router.post("/", async (req, res) => {
    const { type, amount, category, name } = req.body;

    if (!type || !amount || !category || !name) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const { data, error } = await supabase
            .from("transactions")
            .insert([{
                type,
                amount,
                category,
                name,
                createdate: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.log("DB insert error:", error);
            return res.status(500).json({ message: "DB insert error" });
        }
        res.status(201).json({ message: "Transaction created", transaction: data });
    } catch (err) {
        console.log("Server error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// ✏️ PUT (Update) transaction
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { type, amount, category, name } = req.body;

    try {
        const { data, error } = await supabase
            .from("transactions")
            .update({ type, amount, category, name })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.log("DB update error:", error);
            return res.status(500).json({ message: "DB update error" });
        }
        res.json({ message: "Transaction updated successfully", transaction: data });
    } catch (err) {
        console.log("Server error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// 🗑️ DELETE transaction
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from("transactions")
            .delete()
            .eq("id", id);

        if (error) {
            console.log("DB delete error:", error);
            return res.status(500).json({ message: "DB delete error" });
        }
        res.json({ message: "Transaction deleted successfully" });
    } catch (err) {
        console.log("Server error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;