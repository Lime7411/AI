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
                    const exerciseParts = item.textContent.split(" - ");
                    const name = exerciseParts[0].trim();
                    const details = exerciseParts[1] ? exerciseParts[1].trim() : "";

                    // Only try to match if details exist
                    if (details.trim() !== "") {
                        const setsMatch = details.match(/(\d+)x/) || [];
                        const repsMatch = details.match(/x\s*(\d+)/) || [];
                        const restMatch = details.match(/poilsis:\s*(\d+\w+)/i) || [];
                        
                        exercises.push({
                            name: name,
                            sets: setsMatch[1] || "N/A",
                            reps: repsMatch[1] || "N/A",
                            rest: restMatch[1] || "N/A"
                        });
                    }
                });
            }
            nextElement = nextElement.nextElementSibling;
        }
        
        // Add the extracted day to the program
        programData.push({
            day: index + 1,
            title: dayTitle,
            exercises: exercises
        });
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
    
    // Set Font for Lithuanian Characters
    doc.setFont('Helvetica');
    
    // Fitukas Branding
    doc.setFontSize(26);
    doc.text('Fitukas - Tavo Asmeninė Treniruotė', 40, 50);
    doc.setFontSize(12);
    doc.text('Sukurta pagal tavo pasirinktus tikslus ir lygį', 40, 70);
    doc.text('-----------------------------------------------', 40, 80);

    // Add User's Workout Program
    let yPosition = 100;
    programData.forEach((day, index) => {
        doc.setFontSize(18);
        doc.text(`Diena ${index + 1} - ${day.title}`, 40, yPosition);
        yPosition += 20;

        day.exercises.forEach((exercise) => {
            doc.setFontSize(14);
            doc.text(`• ${exercise.name}`, 60, yPosition);
            yPosition += 16;
            doc.setFontSize(12);
            doc.text(`   - Kartojimai: ${exercise.sets} x ${exercise.reps}`, 70, yPosition);
            yPosition += 14;
            doc.text(`   - Poilsis: ${exercise.rest}`, 70, yPosition);
            yPosition += 18;
        });
    });

    // Footer
    doc.setFontSize(10);
    doc.text('Daugiau programų ir pratimų: fitukas.lt', 40, yPosition + 40);
    doc.text('Sekmės treniruotėse! 💪', 40, yPosition + 55);

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
