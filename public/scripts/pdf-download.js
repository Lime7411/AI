// Initialize jsPDF from the UMD module
const { jsPDF } = window.jspdf;

// Extract structured data from the HTML response
function extractProgramData(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const programData = [];
    
    // Find each training day (h2 is used for each day title in your HTML)
    const days = doc.querySelectorAll("h2");
    
    days.forEach((day, index) => {
        const dayTitle = day.textContent.trim();
        const exercises = [];
        
        // Find the exercises under each day
        let nextElement = day.nextElementSibling;
        while (nextElement && nextElement.tagName !== "H2") {
            if (nextElement.tagName === "UL") {
                const exerciseItems = nextElement.querySelectorAll("li");
                
                exerciseItems.forEach(item => {
                    const text = item.textContent.trim();
                    const nameMatch = text.match(/^(.*?)\s*-\s*(.*)$/);
                    let name = text;
                    let details = "";

                    if (nameMatch) {
                        name = nameMatch[1].trim();
                        details = nameMatch[2].trim();
                    }

                    // Extract sets, reps, and rest correctly
                    const setsMatch = details.match(/(\d+)x/) || [];
                    const repsMatch = details.match(/x\s*(\d+)/) || [];
                    const restMatch = details.match(/poilsis:\s*(\d+\s*\w+)/i) || [];
                    
                    exercises.push({
                        name: name,
                        sets: setsMatch[1] || "N/A",
                        reps: repsMatch[1] || "N/A",
                        rest: restMatch[1] || "N/A"
                    });
                });
            }
            nextElement = nextElement.nextElementSibling;
        }
        
        // Add the extracted day to the program if it has exercises
        if (exercises.length > 0) {
            programData.push({
                day: index + 1,
                title: dayTitle,
                exercises: exercises
            });
        }
    });
    
    return programData;
}

function downloadWorkoutProgram(htmlContent) {
    const programData = extractProgramData(htmlContent);
    const doc = new jsPDF({
        unit: 'pt',
        format: 'a4',
        orientation: 'portrait'
    });
    
    // Set Font for Lithuanian Characters (Roboto or similar)
    doc.setFont('Helvetica');
    
    // Fitukas Branding
    doc.setFontSize(26);
    doc.text('Fitukas - Tavo Asmeninė Treniruotė', 40, 60);
    doc.setFontSize(14);
    doc.text('Sukurta pagal tavo pasirinktus tikslus ir lygį', 40, 80);
    doc.setLineWidth(0.5);
    doc.line(40, 90, 550, 90);

    // Add User's Workout Program
    let yPosition = 120;
    programData.forEach((day, index) => {
        doc.setFontSize(18);
        doc.text(`Diena ${index + 1} - ${day.title}`, 40, yPosition);
        yPosition += 30;

        day.exercises.forEach((exercise, exIndex) => {
            doc.setFontSize(14);
            doc.text(`${exIndex + 1}. ${exercise.name}`, 60, yPosition);
            yPosition += 20;
            doc.setFontSize(12);
            if (exercise.sets !== "N/A" && exercise.reps !== "N/A") {
                doc.text(`   - Kartojimai: ${exercise.sets} x ${exercise.reps}`, 80, yPosition);
                yPosition += 15;
            }
            if (exercise.rest !== "N/A") {
                doc.text(`   - Poilsis: ${exercise.rest}`, 80, yPosition);
                yPosition += 15;
            }
            yPosition += 10;
        });
        yPosition += 15;
    });

    // Footer
    doc.setFontSize(12);
    doc.text('Daugiau programų ir pratimų: fitukas.lt', 40, yPosition + 40);
    doc.text('Sėkmės treniruotėse! 💪', 40, yPosition + 60);

    // Download the PDF
    doc.save('fitukas-treniruote.pdf');
}

document.getElementById("download-btn").addEventListener("click", () => {
    const programHtml = document.getElementById("program-container").innerHTML;
    if (programHtml.trim() === "") {
        alert("Nėra sukurtos programos. Pirmiausia sugeneruokite treniruotę.");
        return;
    }
    downloadWorkoutProgram(programHtml);
});
