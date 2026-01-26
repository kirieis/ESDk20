import java.io.FileWriter;
import java.time.LocalDate;
import java.util.Random;

public class DataGenerator {

    public static void main(String[] args) throws Exception {
        FileWriter fw = new FileWriter("medicines_raw.csv"); // 10000 raw records with bugs
        fw.write("medicine_id,name,batch,expiry,quantity\n");

        String[] medicines = {
                "Paracetamol_500mg",
                "Aspirin_500mg",
                "Amoxicillin_500mg",
                "Ibuprofen_200mg",
                "Cefixime_200mg",
                "Vitamin_C",
                "Meloxicam_7.5mg",
                "Cefdinir_300mg",
                "SkillMax_Ocavill",
                "Siro_Ginkid_ZinC",
                "Echina_Kingphar",
                "Panadol_Extra",
                "Efferalgan_500mg",
                "Hapacol_650",
                "Alphachoay",
                "Augmentin_625mg",
                "Cefuroxim_500mg",
                "Acyclovir_400mg",
                "Nexium_mups_20mg",
                "Loperamid_2mg",
                "Enterogermina",
                "Tiffy_Dey",
                "Telfast_HD_180mg",
                "Eugica",
                "Enat_400",
                "Ginkgo_Biloba_120mg",
        };

        Random r = new Random();
        for (int i = 1; i <= 10000; i++) {
            boolean error = r.nextInt(100) < 8; // ~8% lỗi
            String id = error ? "" : "MED" + i;
            String name = error ? "###" : medicines[r.nextInt(medicines.length)];
            char letter = (char) ('A' + r.nextInt(26));
            int num = r.nextInt(100); // 0–99
            String batch = letter + String.valueOf(num);
            String expiry = error ? "invalid-date"
                    : LocalDate.now().plusDays(r.nextInt(500) - 200).toString();
            int qty = error ? -r.nextInt(100) : r.nextInt(200) + 1;

            fw.write(id + "," + name + "," + batch + "," + expiry + "," + qty + "\n");
        }
        fw.close();
    }
}
