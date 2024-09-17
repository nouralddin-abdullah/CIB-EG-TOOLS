        // Toggle between consistent and variable interest rate
        function toggleInterestRateMode() {
          const isConsistent = document.getElementById("consistentRateSwitch").checked;
          const interestRatesContainer = document.getElementById("interestRatesContainer");
          const consistentRateContainer = document.getElementById("consistentRateContainer");
          if (isConsistent) {
              interestRatesContainer.innerHTML = ""; // Clear the variable interest rate fields
              consistentRateContainer.style.display = "block"; // Show consistent rate input
          } else {
              consistentRateContainer.style.display = "none"; // Hide consistent rate input
              generateInterestFields(); // Show variable rate fields
          }
      }

      // Generate interest rate fields dynamically based on the number of years
      function generateInterestFields() {
          const isConsistent = document.getElementById("consistentRateSwitch").checked;
          const time = document.getElementById("time").value;
          const container = document.getElementById("interestRatesContainer");
          if (!isConsistent) {
              container.innerHTML = ""; // Clear previous fields
              for (let i = 1; i <= time; i++) {
                  container.innerHTML += `
                      <div class="mb-3">
                          <label for="rateYear${i}" class="form-label">Interest Rate for Year ${i} (%)</label>
                          <input type="number" class="form-control" id="rateYear${i}" required>
                      </div>`;
              }
          }
      }

      // Calculate interest based on the selected options
      function calculateInterestForEachYear(amount, time, frequency, startDate) {
          let totalInterest = 0;
          const isConsistent = document.getElementById("consistentRateSwitch").checked;
          const isAccumulated = document.getElementById("accumulatedInterestSwitch").checked;
          let rate;
          let totalAmount = amount;
          let results = [];
          let cumulativeInterest = 0;

          if (isConsistent) {
              rate = parseFloat(document.getElementById("consistentRate").value);
          }

          let currentDate = new Date(startDate);
          const totalPeriods = frequency === "monthly" ? time * 12 : frequency === "daily" ? time * 365 : time;

          for (let i = 1; i <= totalPeriods; i++) {
              if (!isConsistent) {
                  rate = parseFloat(document.getElementById(`rateYear${Math.ceil(i / (frequency === "monthly" ? 12 : 1))}`).value);
              }

              const periodRate = rate / (frequency === "monthly" ? 12 : frequency === "daily" ? 365 : 1);
              const interest = amount * (periodRate / 100);

              let interestForPeriod; // Declare interestForPeriod here

              // Accumulated (Compound) Interest Calculation
              if (isAccumulated) {
                  const previousTotalAmount = totalAmount;
                  const compInterest = totalAmount * (periodRate / 100);
                  totalAmount += compInterest;
                  interestForPeriod = totalAmount - previousTotalAmount;
              } else {
                  totalInterest += interest;
                  interestForPeriod = interest;
              }

              cumulativeInterest += interestForPeriod;

              const interestAddedDate = new Date(currentDate);

              if (frequency === "monthly") {
                  interestAddedDate.setMonth(currentDate.getMonth() + 1);
              } else if (frequency === "daily") {
                  interestAddedDate.setDate(currentDate.getDate() + 1);
              } else {
                  interestAddedDate.setFullYear(currentDate.getFullYear() + 1);
              }

              results.push({
                  date: new Date(interestAddedDate),
                  interest: interestForPeriod,
                  cumulativeInterest: cumulativeInterest,
                  total: isAccumulated ? totalAmount : amount + totalInterest
              });

              currentDate = interestAddedDate;
          }

          const totalMaturity = isAccumulated ? totalAmount : amount + totalInterest;
          return {
              totalInterest: isAccumulated ? totalAmount - amount : totalInterest,
              totalMaturity: totalMaturity,
              interestData: results,
          };
      }

      function downloadExcel(interestData) {
          // Convert interest data to CSV format
          let csvContent = "data:text/csv;charset=utf-8,";
          csvContent += "Date,Interest Gained This Period (EGP),Total Interest Till This Period (EGP),Account Balance + Interest (EGP)\n";

          interestData.forEach(function (rowArray) {
              let row = rowArray.date.toLocaleDateString() + "," + rowArray.interest.toFixed(2) + "," + rowArray.cumulativeInterest.toFixed(2) + "," + rowArray.total.toFixed(2) + "\n";
              csvContent += row;
          });

          // Create a download link and trigger the download
          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download",
              "interest_data.csv");
          document.body.appendChild(link);
          link.click();

      }


      function showResult() {
          const amount = parseFloat(document.getElementById("amount").value);
          const time = parseFloat(document.getElementById("time").value);
          const frequency = document.getElementById("frequency").value;
          const startDate = document.getElementById("startDate").value;
          const result = calculateInterestForEachYear(amount, time, frequency, startDate);
          const totalInterest = result.totalInterest;
          const totalMaturity = result.totalMaturity;
          const interestData = result.interestData;

          let rate;
          if (document.getElementById("consistentRateSwitch").checked) {
              rate = parseFloat(document.getElementById("consistentRate").value);
          } else {
              rate = parseFloat(document.getElementById("rateYear1").value); // Use the first year's rate for one period
          }

          // Calculate the interest for one frequency period
          const onePeriodInterest = (amount * (rate / 100)) / (frequency === "daily" ? 365 : frequency === "monthly" ? 12 : 1);

          document.getElementById("onePeriodInterest").innerHTML =
              "Interest for 1 " + frequency + ": " + onePeriodInterest.toFixed(2) + " EGP";
          document.getElementById("totalInterest").innerHTML = "Total Interest: " + totalInterest.toFixed(2) + " EGP";
          document.getElementById("totalMaturity").innerHTML = "Total Maturity (FV + Interest): " + totalMaturity.toFixed(2) + " EGP";

          generatePDF(amount, totalInterest, totalMaturity, time, frequency, startDate, interestData);
          document.getElementById("pdfButtons").style.display = "block";
          document.getElementById("downloadExcel").addEventListener("click", function () {
              downloadExcel(interestData);
          });
      }

      // Generate PDF with interest data
      function generatePDF(amount, totalInterest, totalMaturity, time, frequency, startDate, interestData) {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();

          // Set initial Y position for the content
          let yPosition = 20;
          const pageHeight = doc.internal.pageSize.height;
          const lineHeight = 10;

          // Add headers
          doc.text("CIB Bank Employee Tools", 20, yPosition);
          yPosition += lineHeight;
          doc.text("Deposit Calculation Report", 20, yPosition);
          yPosition += lineHeight;
          doc.text("Principal Amount: " + amount.toFixed(2) + " EGP", 20, yPosition);
          yPosition += lineHeight;
          doc.text("Total Interest: " + totalInterest.toFixed(2) + " EGP", 20, yPosition);
          yPosition += lineHeight;
          doc.text("Total Maturity (FV + Interest): " + totalMaturity.toFixed(2) + " EGP", 20, yPosition);
          yPosition += lineHeight;
          doc.text("Duration: " + time + " years", 20, yPosition);
          yPosition += lineHeight;
          doc.text("Interest Frequency: " + frequency.charAt(0).toUpperCase() + frequency.slice(1), 20, yPosition);
          yPosition += lineHeight;
          doc.text("Start Date: " + new Date(startDate).toLocaleDateString(), 20, yPosition);
          yPosition += lineHeight + 5;

          // Draw table headers with two rows for long titles
          doc.text("Date", 20, yPosition);
          doc.text("Interest Gained", 80, yPosition);
          doc.text("This Period (EGP)", 80, yPosition + 5); // Add second row for long headers
          doc.text("Total Interest", 130, yPosition);
          doc.text("Till This Period (EGP)", 130, yPosition + 5); // New column for cumulative interest
          doc.text("Account Balance + Interest (EGP)", 180, yPosition);
          yPosition += lineHeight + 5;

          // Loop through interestData and add each row to the table
          interestData.forEach((entry) => {
              // Add new page if content exceeds page height
              if (yPosition > pageHeight - 20) {
                  doc.addPage();
                  yPosition = 20; // Reset yPosition for the new page

                  // Redraw the table headers on the new page
                  doc.text("Date", 20, yPosition);
                  doc.text("Interest Gained", 80, yPosition);
                  doc.text("This Period (EGP)", 80, yPosition + 5);
                  doc.text("Total Interest", 130, yPosition);
                  doc.text("Till This Period (EGP)", 130, yPosition + 5);
                  doc.text("Account Balance + Interest (EGP)", 180, yPosition);
                  yPosition += lineHeight + 5;
              }

              // Add table content
              doc.text(new Date(entry.date).toLocaleDateString(), 20, yPosition);
              doc.text(entry.interest.toFixed(2), 80, yPosition); // Interest for this period
              doc.text(entry.cumulativeInterest.toFixed(2), 130, yPosition); // Cumulative interest till this period
              doc.text(entry.total.toFixed(2), 180, yPosition); // Total balance + interest
              yPosition += lineHeight;
          });

          // Generate PDF Blob and URLs for opening and printing
          const pdfBlob = doc.output("blob");
          const pdfUrl = URL.createObjectURL(pdfBlob);

          // Remove existing event listeners (to avoid conflicts with previous calculations)
          const openButton = document.getElementById("openPDF");
          const printButton = document.getElementById("printPDF");
          const excelButton = document.getElementById("downloadExcel");

          openButton.replaceWith(openButton.cloneNode(true)); // Reset button to remove all listeners
          printButton.replaceWith(printButton.cloneNode(true));
          excelButton.replaceWith(excelButton.cloneNode(true));

          // Get new button elements after reset
          const newOpenButton = document.getElementById("openPDF");
          const newPrintButton = document.getElementById("printPDF");
          const newExcelButton = document.getElementById("downloadExcel");

          // Define event handler functions
          function openPDFHandler() {
              window.open(pdfUrl, "_blank"); // Open new PDF in a tab
          }

          function printPDFHandler() {
              const iframe = document.createElement("iframe");
              iframe.style.display = "none";
              iframe.src = pdfUrl;
              document.body.appendChild(iframe);
              iframe.contentWindow.focus();
              iframe.contentWindow.print(); // Trigger print
          }

          // Add new event listeners for Open and Print PDF buttons
          newOpenButton.addEventListener("click", openPDFHandler);
          newPrintButton.addEventListener("click", printPDFHandler);

      }
