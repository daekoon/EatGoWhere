package servlets;

import java.io.InputStream;
import java.io.IOException;
import java.util.Properties;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/client-config")
public class ClientConfigServlet extends HttpServlet {
    Properties properties = new Properties();

    @Override
    public void init() {
        ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
        InputStream input = classLoader.getResourceAsStream("client.properties");

        try {
            properties.load(input);
        }
        catch (IOException e) {
            System.out.printf("Error while trying to read config file: %s\n", e.toString());
        }
    }

    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException{
        String key = request.getParameter("key");

        response.setContentType("text/html;");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().println(properties.getProperty(key, ""));
    }
}