package servlets;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.gson.Gson;
import com.google.maps.model.LatLng;
import com.google.maps.model.PlaceType;
import com.google.maps.model.PlacesSearchResponse;
import com.google.maps.NearbySearchRequest;
import com.google.maps.GeoApiContext;

// Maps javadoc: https://www.javadoc.io/static/com.google.maps/google-maps-services/0.14.0/overview-summary.html

@WebServlet("/places-list")
public class PlacesListServlet extends HttpServlet {
    GeoApiContext context;

    @Override
    public void init() {
        this.context = new GeoApiContext.Builder()
            .apiKey("API_KEY_HERE")
            .build();
    }

    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException{
        Double lat = Double.parseDouble(request.getParameter("lat"));
        Double lng = Double.parseDouble(request.getParameter("lng"));
        LatLng currentLocation = new LatLng(lat, lng);
        String filters = request.getParameter("filter").replace(',', '+');

        NearbySearchRequest nearbySearch = new NearbySearchRequest(this.context)
            .location(currentLocation)
            .radius(500) // Metres, can change via filter
            .openNow(true)
            .type(PlaceType.RESTAURANT);
            .keyword(filters);
        
        try {
            PlacesSearchResponse nearby = nearbySearch.await(); //Returns top 20 results(One page)

            response.setContentType("application/json;");
            Gson gson = new Gson();
            response.getWriter().println(gson.toJson(nearby));
        }
        catch (IOException e) {
            throw e;
        }
        catch (Exception e) {
            throw new ServletException(e);
        }
    }
}