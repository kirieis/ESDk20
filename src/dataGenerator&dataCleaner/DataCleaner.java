import java.io.BufferedReader;
import java.io.FileReader;
import java.io.FileWriter;
import java.time.LocalDate;

public class DataCleaner {

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new FileReader("medicines_raw.csv"));
        FileWriter fw = new FileWriter("medicines_clean.csv"); // cleaned records -> 

        fw.write(br.readLine() + "\n");
        String line;

        while ((line = br.readLine()) != null) {
            String[] p = line.split(",");
            try {
                if (p.length != 11) continue;
                if (p[0].isEmpty()) continue;
                if (p[1].equals("###")) continue;
                if (p[2].equals("???")) continue;
                if (Integer.parseInt(p[9]) <= 0) continue;
                if (LocalDate.parse(p[8]).isBefore(LocalDate.now())) continue;
                if(Integer.parseInt(p[10]) <= 0) continue;
                fw.write(line + "\n");
            } catch (Exception ignored) {}
        }
        br.close();
        fw.close();
    }
}
// 0 1 2 8 9 