package core_app.servlet;

import core_app.dao.CustomerDAO;
import core_app.model.Customer;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;

@WebServlet("/verify-otp")
public class VerifyOTPServlet extends HttpServlet {

    private final CustomerDAO customerDAO = new CustomerDAO();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String inputOTP = req.getParameter("otp");
        HttpSession session = req.getSession();

        String sessionOTP = (String) session.getAttribute("registrationOTP");
        Customer pendingUser = (Customer) session.getAttribute("pendingUser");
        Long otpTime = (Long) session.getAttribute("otpTime");

        // Kiểm tra hết hạn (5 phút)
        if (otpTime == null || (System.currentTimeMillis() - otpTime > 5 * 60 * 1000)) {
            resp.sendRedirect("register.html?error=otp_expired");
            return;
        }

        if (sessionOTP != null && sessionOTP.equals(inputOTP)) {
            if (customerDAO.add(pendingUser)) {
                session.removeAttribute("registrationOTP");
                session.removeAttribute("pendingUser");
                session.removeAttribute("otpTime");
                resp.sendRedirect("login.html?registered=true");
            } else {
                resp.sendRedirect("register.html?error=exists");
            }
        } else {
            resp.sendRedirect("verify_otp.html?error=invalid");
        }
    }
}
