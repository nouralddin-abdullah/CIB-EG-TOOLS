function toggleInterestRateMode() {
    const isConsistent = document.getElementById(
      "consistentRateSwitch"
    ).checked;
    const interestRatesContainer = document.getElementById(
      "interestRatesContainer"
    );
    const consistentRateContainer = document.getElementById(
      "consistentRateContainer"
    );

    if (isConsistent) {
      interestRatesContainer.innerHTML = ""; // Clear the variable interest rate fields
      consistentRateContainer.style.display = "block"; // Show consistent rate input
    } else {
      consistentRateContainer.style.display = "none"; // Hide consistent rate input
      generateInterestFields(); // Show variable rate fields
    }
  }

  function generateInterestFields() {
    const isConsistent = document.getElementById(
      "consistentRateSwitch"
    ).checked;
    const time = document.getElementById("time").value;
    const container = document.getElementById("interestRatesContainer");

    if (!isConsistent) {
      container.innerHTML = ""; // Clear previous fields
      // Generate interest rate inputs for each year
      for (let i = 1; i <= time; i++) {
        container.innerHTML += `
                    <div class="mb-3">
                        <label for="rateYear${i}" class="form-label">Interest Rate for Year ${i} (%)</label>
                        <input type="number" class="form-control" id="rateYear${i}">
                    </div>
                `;
      }
    }
  }

  function calculateInterestForEachYear(
    amount,
    time,
    frequency,
    startDate
  ) {
    let totalInterest = 0;
    let isConsistent = document.getElementById(
      "consistentRateSwitch"
    ).checked;
    let rate;
    let faceValue = amount; // Always use the initial principal amount for interest calculation
    let results = [];

    if (isConsistent) {
      rate = parseFloat(document.getElementById("consistentRate").value);
    }

    let currentDate = new Date(startDate);

    for (let i = 1; i <= time; i++) {
      if (!isConsistent) {
        rate = parseFloat(document.getElementById(`rateYear${i}`).value);
      }

      let yearlyInterest = faceValue * (rate / 100); // Calculate interest based on face value

      let interestAddedDate = new Date(currentDate);

      if (frequency === "daily") {
        let dailyInterest = yearlyInterest / 365;
        for (let j = 0; j < 365; j++) {
          interestAddedDate.setDate(interestAddedDate.getDate() + 1);
          totalInterest += dailyInterest;
          results.push({
            date: new Date(interestAddedDate),
            interest: dailyInterest,
            total: faceValue + totalInterest, // Total = faceValue + accumulated interest
          });
        }
      } else if (frequency === "monthly") {
        let monthlyInterest = yearlyInterest / 12;
        for (let j = 0; j < 12; j++) {
          interestAddedDate.setMonth(interestAddedDate.getMonth() + 1);
          totalInterest += monthlyInterest;
          results.push({
            date: new Date(interestAddedDate),
            interest: monthlyInterest,
            total: faceValue + totalInterest,
          });
        }
      } else if (frequency === "yearly") {
        interestAddedDate.setFullYear(interestAddedDate.getFullYear() + 1);
        totalInterest += yearlyInterest;
        results.push({
          date: new Date(interestAddedDate),
          interest: yearlyInterest,
          total: faceValue + totalInterest,
        });
      }

      currentDate = interestAddedDate; // Move to the next year
    }

    return {
      totalInterest: totalInterest,
      totalMaturity: faceValue + totalInterest,
      interestData: results,
    };
  }

  function showResult() {
    const amount = parseFloat(document.getElementById("amount").value);
    const time = parseFloat(document.getElementById("time").value);
    const frequency = document.getElementById("frequency").value;
    const startDate = document.getElementById("startDate").value;

    const result = calculateInterestForEachYear(
      amount,
      time,
      frequency,
      startDate
    );
    const totalInterest = result.totalInterest;
    const totalMaturity = result.totalMaturity;
    const interestData = result.interestData;

    // Calculate the interest for one frequency period
    let rate;
    if (document.getElementById("consistentRateSwitch").checked) {
      rate = parseFloat(document.getElementById("consistentRate").value);
    } else {
      rate = parseFloat(document.getElementById("rateYear1").value); // Use the first year's rate for one frequency
    }

    // Calculate the interest for one frequency period based on the frequency selected
    let onePeriodInterest;
    if (frequency === "daily") {
      onePeriodInterest = (amount * (rate / 100)) / 365; // Daily interest
    } else if (frequency === "monthly") {
      onePeriodInterest = (amount * (rate / 100)) / 12; // Monthly interest
    } else if (frequency === "yearly") {
      onePeriodInterest = amount * (rate / 100); // Yearly interest
    }

    // Display the interest for one frequency period at the top
    document.getElementById("onePeriodInterest").innerHTML =
      "Interest for 1 " +
      frequency +
      ": " +
      onePeriodInterest.toFixed(2) +
      " EGP";

    // Update the total interest and maturity in the HTML
    document.getElementById("totalInterest").innerHTML =
      "Total Interest: " + totalInterest.toFixed(2) + " EGP";
    document.getElementById("totalMaturity").innerHTML =
      "Total Maturity (FV + Interest): " +
      totalMaturity.toFixed(2) +
      " EGP";

    // Generate the PDF report
    generatePDF(
      amount,
      totalInterest,
      totalMaturity,
      time,
      frequency,
      startDate,
      interestData
    );
  }

  function generatePDF(
    amount,
    totalInterest,
    totalMaturity,
    time,
    frequency,
    startDate,
    interestData
  ) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yPosition = 30; // Start Y position for the content
    const pageHeight = 280; // Height of the page

    // Add content to the PDF
    doc.text("CIB Bank Employee Tools", 20, 10);
    doc.text("Deposit Calculation Report", 20, 20);
    doc.text("-----------------------------------", 20, 30);
    yPosition += 10;

    doc.text(`Principal Amount: ${amount.toFixed(2)} EGP`, 20, yPosition);
    yPosition += 10;
    doc.text(
      `Total Interest: ${totalInterest.toFixed(2)} EGP`,
      20,
      yPosition
    );
    yPosition += 10;
    doc.text(
      `Total Maturity (FV + Interest): ${totalMaturity.toFixed(2)} EGP`,
      20,
      yPosition
    );
    yPosition += 10;
    doc.text(`Duration: ${time} years`, 20, yPosition);
    yPosition += 10;
    doc.text(
      `Interest Frequency: ${
        frequency.charAt(0).toUpperCase() + frequency.slice(1)
      }`,
      20,
      yPosition
    );
    yPosition += 10;
    doc.text(
      `Start Date: ${new Date(startDate).toLocaleDateString()}`,
      20,
      yPosition
    );
    yPosition += 10;
    doc.text("-----------------------------------", 20, yPosition);
    yPosition += 10;

    // Table headers
    doc.text("Date", 20, yPosition);
    doc.text("Interest Added (EGP)", 80, yPosition);
    doc.text("Total Amount (EGP)", 150, yPosition);
    yPosition += 10;

    // Loop through interestData and add to the table
    interestData.forEach((entry) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage(); // Add a new page if the content exceeds one page
        yPosition = 30; // Reset yPosition for new page
      }
      doc.text(new Date(entry.date).toLocaleDateString(), 20, yPosition);
      doc.text(entry.interest.toFixed(2), 80, yPosition);
      doc.text(entry.total.toFixed(2), 150, yPosition);
      yPosition += 10; // Move down for each row
    });

    // Instead of saving, open the PDF in a new tab
    const string = doc.output("blob"); // Get the PDF as a blob
    const blob = new Blob([string], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank"); // Open PDF in a new tab
    
  }
  document.addEventListener("DOMContentLoaded", function () {
      generateInterestFields(); // Call the function to generate fields by default
    });