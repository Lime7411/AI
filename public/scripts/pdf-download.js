import jsPDF from 'jspdf';

function downloadWorkoutProgram(programData) {
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
        doc.text(`Diena ${index + 1}`, 20, yPosition);
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
    downloadWorkoutProgram(generatedProgram);
});
