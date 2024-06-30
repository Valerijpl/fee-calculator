const args = process.argv.slice(2);
const path = args[0] ? args[0] : 'test.json';
var naturalUsersTransactions;

// FUNCTIONS WE WILL USE 

function formatDate(date) {
    let d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

function getStartWeekDate(d) {
    const day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6 : 1);
    return formatDate(new Date(d.setDate(diff)));
}

function getEndWeekDate(d){
    const day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6 : 1);

    return formatDate(new Date(d.setDate(diff + 6)));
}

function calculateFeeNaturalUser(freeChargeLimit, amount){
    if (freeChargeLimit >= amount){
        return 0;
    } else {
        if (freeChargeLimit === 0){
            return amount * 0.003;
        } else {
            return (amount - freeChargeLimit) * 0.003;
        }
    }
}

function getFreeChargeLimit(freeChargeLimit, amount){
    if (freeChargeLimit > amount){
        return freeChargeLimit - amount;
    } else {
        return 0;
    }
}

function roundFeeValue(fee){
    const diff = fee - fee.toFixed(2);
    if (diff > 0.001 && diff < 0.005){
        return (Number(fee.toFixed(2)) + 0.01).toString();
    } else {
        return fee.toFixed(2);
    }
}

// COMPLEX PART OF FUNCTIONALITY TO GROUP ALL CASH OUT NATURAL USER TRANSACTIONS FOR THE SAME WEEK AND USER
// TO CALCULATE FEE FOR EACH ACCORDING TO WEEK NO CHARGE LIMIT AND STORE RESULT TO GLOBAL CONSTANT TO NOT LOOP
// EVERYTIME WE NEED GET CALCULATED FEE 

function calculateCashOutNaturalUsers(list){
    let result = [];

    list.forEach(element => {
        if (element.user_type === 'natural' && element.type === 'cash_out'){
            const startWeekDate = getStartWeekDate(new Date(element.date));
            if (result.find(x => x.startWeekDate === startWeekDate && x.userId === element.user_id)){
                let selectedRange = result.find(x => x.startWeekDate === startWeekDate && x.userId === element.user_id);
                element.fee = calculateFeeNaturalUser(selectedRange.freeChargeLimit, element.operation.amount);
                selectedRange.freeChargeLimit = getFreeChargeLimit(selectedRange.freeChargeLimit, element.operation.amount);
                selectedRange.operations.push(element);
            } else {
                let userWeekTransactions = {
                    userId: element.user_id, 
                    startWeekDate: startWeekDate,
                    endWeekDate: getEndWeekDate(new Date(element.date)),
                    freeChargeLimit: 1000,
                    operations: []
                };

                element.fee = calculateFeeNaturalUser(userWeekTransactions.freeChargeLimit, element.operation.amount);
                userWeekTransactions.freeChargeLimit = getFreeChargeLimit(1000, element.operation.amount);  
                userWeekTransactions.operations.push(element);
                result.push(userWeekTransactions);
            }
        }
    });

    return result;
}

function calculateCashInFee(amount){
    if (amount * 0.0003 > 5){
        return 5;
    } else {
        return amount * 0.0003;
    }
}

function calculateCashOutFee(obj){
    if (obj.user_type === 'natural'){
        const startWeekDate = getStartWeekDate(new Date(obj.date));
        const selectedRange = naturalUsersTransactions.find(x => x.userId === obj.user_id && x.startWeekDate === startWeekDate);
        return selectedRange.operations.find(x => x.transaction_id == obj.transaction_id).fee;
    } else {
        if (obj.operation.amount * 0.003 < 0.5){
            return 0.5;
        } else {
            return obj.operation.amount * 0.003;
        }
    }
}

function calculateFee(obj){
    switch (obj.type) {
        case 'cash_in': return roundFeeValue(calculateCashInFee(obj.operation.amount));
        case 'cash_out': return roundFeeValue(calculateCashOutFee(obj));
        default: return 'Unsupported type of operation';
    }
}

// EXECUTION PART

const fs = require('fs');

try {
    const data = fs.readFileSync(path, 'utf8');
    let transactionsList = JSON.parse(data);

    transactionsList.forEach(element => {
        element.transaction_id = (Math.random() + 1).toString(36).substring(7);
    });

    naturalUsersTransactions = calculateCashOutNaturalUsers(transactionsList);

    transactionsList.forEach(element => {
        console.log(calculateFee(element));
    });
} catch (err) {
    console.error('Error reading or parsing the file:', err);
}

exports._test = {
    formatDate: formatDate,
    getStartWeekDate: getStartWeekDate,
    getEndWeekDate: getEndWeekDate,
    calculateFeeNaturalUser: calculateFeeNaturalUser,
    calculateCashInFee: calculateCashInFee,
    roundFeeValue: roundFeeValue
}