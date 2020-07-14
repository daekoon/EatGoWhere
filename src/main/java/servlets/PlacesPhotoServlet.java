package servlets;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.maps.GeoApiContext;
import com.google.maps.PhotoRequest;
import com.google.maps.ImageResult;


@WebServlet("/places-photo")
public class PlacesPhotoServlet extends HttpServlet {
    GeoApiContext context;

    @Override
    public void init() {
        this.context = new GeoApiContext.Builder()
            .apiKey("API_KEY_HERE")
            .build();
    }

    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException{
        String photoRef = request.getParameter("photoRef");

        PhotoRequest photoRequest = new PhotoRequest(this.context)
            .maxWidth(150)
            .photoReference(photoRef);
            
        try {
            ImageResult photo = photoRequest.await();
            response.setContentType(photo.contentType);
            response.getOutputStream().write(photo.imageData);
        }
        catch (IOException e) {
            throw e;
        }
        catch (Exception e) {
            throw new ServletException(e);
        }
    }
}