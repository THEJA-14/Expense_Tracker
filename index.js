const express = require('express');
const cron = require('node-cron');
const app = express();

const port = 3000;

const expenses = [];
const reports = {
    daily: [],
    weekly: [],
    monthly: [],
};

app.post('/expenses', (req, res) => {
    const { category, amount, date } = req.query;

    if (!category || !amount || !date) {
        return res.status(400).json({ 
            status: "error", 
            message: "Missing required fields: category, amount, or date" 
        });
    }

    const expense = {
        id: expenses.length + 1,
        category,
        amount: parseFloat(amount),
        date: new Date(date),
    };

    expenses.push(expense);
    res.status(201).json({ 
        status: "success", 
        data: expense 
    });
});

app.get('/expenses', (req, res) => {
    res.json({ 
        status: "success", 
        data: expenses 
    });
});

app.get('/reports/:type', (req, res) => {
    const { type } = req.params;
    if (!['daily', 'weekly', 'monthly'].includes(type)) {
        return res.status(400).json({ 
            status: "error", 
            message: "Invalid report type. Use 'daily', 'weekly', or 'monthly'." 
        });
    }

    res.json({ 
        status: "success", 
        data: reports[type] 
    });
});

app.get('/expenses/analysis', (req, res) => {
    const totalByCategory = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    res.json({ 
        status: "success", 
        data: { 
            totalByCategory, 
            totalAmount 
        } 
    });
});

cron.schedule('0 0 * * *', () => {
    generateReport('daily');
});

cron.schedule('0 0 * * 0', () => {
    generateReport('weekly');
});

cron.schedule('0 0 1 * *', () => {
    generateReport('monthly');
});

function generateReport(period) {
    const now = new Date();
    let startDate;

    if (period === 'daily') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
    } else if (period === 'weekly') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    } else if (period === 'monthly') {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }

    const filteredExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= startDate && expDate <= now;
    });

    const totalByCategory = filteredExpenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const report = {
        period,
        generatedAt: new Date(),
        totalAmount,
        totalByCategory,
    };

    reports[period].push(report);
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
