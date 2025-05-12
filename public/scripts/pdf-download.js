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
    const setsMatch = details.match(/(\d+)x/) || [];
    const repsMatch = details.match(/x\s*(\d+)/) || [];
    const restMatch = details.match(/poilsis:\s*(\d+\w+)/i) || [];
    
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
    const doc = new jsPDF();
    
    // Fitukas Branding
    doc.setFont('helvetica');
    doc.setFontSize(22);
    doc.text('Fitukas - Tavo Asmeninė Treniruotė', 20, 30);
    doc.setFontSize(12);
    doc.text('Sukurta pagal tavo pasirinktus tikslus ir lygį', 20, 40);
    doc.text('-----------------------------------------------', 20, 45);

    // Add User's Workout Program
    let yPosition = 60;
    programData.forEach((day, index) => {
        doc.setFontSize(18);
        doc.text(`Diena ${index + 1} - ${day.title}`, 20, yPosition);
        yPosition += 10;

        day.exercises.forEach((exercise) => {
            doc.setFontSize(14);
            doc.text(`• ${exercise.name}`, 20, yPosition);
            yPosition += 7;
            doc.setFontSize(12);
            doc.text(`   - Kartojimai: ${exercise.sets} x ${exercise.reps}`, 20, yPosition);
            yPosition += 7;
            doc.text(`   - Poilsis: ${exercise.rest}`, 20, yPosition);
            yPosition += 10;
        });
    });

    // Footer
    doc.setFontSize(10);
    doc.text('Daugiau programų ir pratimų: fitukas.lt', 20, yPosition + 20);
    doc.text('Sekmės treniruotėse! 💪', 20, yPosition + 30);

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
