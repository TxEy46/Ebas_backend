const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// 🔍 GET ดึงงบประมาณของเดือนที่ต้องการ
router.get("/:monthYear", async (req, res) => {
    const { monthYear } = req.params;

    try {
        const { data, error } = await supabase
            .from("budgets")
            .select("*")
            .eq("month_year", monthYear)
            .maybeSingle();

        if (error) {
            console.log("DB fetch budget error:", error);
            return res.status(500).json({ message: "DB error" });
        }

        if (!data) return res.json({ month_year: monthYear, amount: 0 });
        
        res.json(data);
    } catch (err) {
        console.log("Server error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// 💾 POST บันทึกหรืออัปเดตงบประมาณ
router.post("/", async (req, res) => {
    const { month_year, amount } = req.body;

    if (!month_year || amount === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const { data: existingData } = await supabase
            .from("budgets")
            .select("id")
            .eq("month_year", month_year)
            .maybeSingle();

        let result;

        if (existingData) {
            result = await supabase
                .from("budgets")
                .update({ amount })
                .eq("id", existingData.id)
                .select()
                .single();
        } else {
            result = await supabase
                .from("budgets")
                .insert([{ month_year, amount }])
                .select()
                .single();
        }

        if (result.error) {
            console.log("DB save budget error:", result.error);
            return res.status(500).json({ message: "DB save error" });
        }
        res.json({ message: "Budget saved successfully", budget: result.data });
    } catch (err) {
        console.log("Server error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;